import * as ortTrain from "onnxruntime-web/training";
import { BaseImageModel } from "@/model/base";
import { NVImage } from "@niivue/niivue";
import { toast } from "sonner";
import { LesionBatch } from "@/components/classification-training/mri";

// Aphasia type encoding: [Naming, Fluency, Comprehension, Repetition]
// 1 = Preserved/Intact, 0 = Impaired
export const APHASIA_ENCODING_MAP: Record<string, number[]> = {
  None: [1, 1, 1, 1],
  Anomic: [0, 1, 1, 1],
  TranscorticalMotor: [0, 0, 1, 1],
  Broca: [0, 0, 1, 0],
  Wernicke: [0, 1, 0, 0],
  Conduction: [0, 1, 1, 0],
  Global: [0, 0, 0, 0],
};

// Reverse mapping from pattern to aphasia type
export const PATTERN_TO_APHASIA: Record<string, string> = Object.fromEntries(
  Object.entries(APHASIA_ENCODING_MAP).map(([type, pattern]) => [
    pattern.join(","),
    type,
  ])
);

export const TEST_NAMES = [
  "Naming",
  "Fluency",
  "Comprehension",
  "Repetition",
] as const;

export interface ClassificationOutput {
  predictions: number[]; // [N, F, C, R] binary predictions
  aphasiaType: string; // Decoded aphasia type
  probabilities?: number[][]; // Optional probabilities for each test
}

export interface TrainingMetrics {
  epoch: number;
  batchNum: number;
  loss: number;
  accuracy?: number;
  iterationsPerSecond: number;
}

export class ClassificationModel extends BaseImageModel {
  /**
   * Preprocess input features for the model
   */
  preprocessInput(inputs: NVImage[]): ortTrain.Tensor {
    const batchSize = inputs.length;
    const featureData = new Float32Array(batchSize);

    inputs.forEach((img, idx) => {
      // Count non-zero voxels as feature
      let count = 0;
      const data = img.img2RAS();
      for (let i = 0; i < data.length; i++) {
        if (data[i] !== 0) count++;
      }
      featureData[idx] = count;
    });

    return new ortTrain.Tensor("float32", featureData, [batchSize, 1, 1]);
  }

  /**
   * Decode model output to aphasia type
   */
  decodeOutput(predictions: number[]): string {
    const patternKey = predictions.join(",");
    return PATTERN_TO_APHASIA[patternKey] || "Unknown";
  }

  /**
   * Run inference on the classification model
   */
  // async predict(inputs: NVImage[]): Promise<ClassificationOutput[]> {
  //   if (!this.initialized || !this.trainSession) {
  //     throw new Error("Model not initialized. Call init() first.");
  //   }

  //   const session =
  //     this.trainSession.get("inference") || this.trainSession.values().next().value;
  //   if (!session) {
  //     throw new Error("No inference session available.");
  //   }

  //   const inputTensor = this.preprocessInput(inputs);

  //   const feeds: ortTrain.InferenceSession.OnnxValueMapType = {
  //     float_input: inputTensor,
  //   };

  //   const results = await session.run(feeds);

  //   // Get output names
  //   const outputNames = await session.outputNames();
  //   const labelsOutput = results[outputNames[0]];
  //   const probsOutput = outputNames.length > 1 ? results[outputNames[1]] : null;

  //   // Process results for each input
  //   const outputs: ClassificationOutput[] = [];
  //   const batchSize = inputs.length;

  //   for (let i = 0; i < batchSize; i++) {
  //     // Extract predictions for this sample
  //     const predictions: number[] = [];
  //     for (let j = 0; j < 4; j++) {
  //       predictions.push(Number(labelsOutput.data[i * 4 + j]));
  //     }

  //     // Extract probabilities if available
  //     let probabilities: number[][] | undefined;
  //     if (probsOutput) {
  //       probabilities = [];
  //       for (let j = 0; j < 4; j++) {
  //         const prob0 = Number(probsOutput.data[i * 8 + j * 2]);
  //         const prob1 = Number(probsOutput.data[i * 8 + j * 2 + 1]);
  //         probabilities.push([prob0, prob1]);
  //       }
  //     }

  //     outputs.push({
  //       predictions,
  //       aphasiaType: this.decodeOutput(predictions),
  //       probabilities,
  //     });
  //   }

  //   return outputs;
  // }

  /**
   * Run training step
   */
  async trainStep(batch: LesionBatch): Promise<{
    loss: number;
    predictions: number[][];
    accuracy: number;
    perTestAccuracies: Record<string, number>;
  }> {
    if (!this.initialized || !this.trainSession) {
      throw new Error("Model not initialized. Call init() first.");
    }
    const session = this.trainSession.get("training");
    if (!session) {
      toast("Training session not available.");
      throw new Error("No training session available.");
    }
    const feeds = {
      input: batch.features,
      target: batch.labels,
    };
    console.log("feeds prepared for training step:", feeds);
    let results;
    // Run training step
    try {
      results = await session.run(feeds);
    } catch (err) {
      throw new Error("No results from training step.");
    }

    // console.log(
    //   "Training step loss:",
    //   results[this.metadata.lossNodeName!].cpuData
    // );
    // Extract loss
    const loss = (results[this.metadata.lossNodeName!] as any).cpuData[0];

    // Extract predictions
    const predictions = this.extractPredictions(
      results["output"],
      batch.features.dims[0]
    );

    const accuracy = this.computeAccuracy(predictions, batch.labels);
    const perTestAccuracies = this.computePerTestAccuracy(
      predictions,
      Array.from({ length: batch.labels.dims[0] }, (_, i) =>
        Array.from({ length: 4 }, (_, j) =>
          Number((batch.labels as any).cpuData[i * 4 + j])
        )
      )
    );
    console.log(
      `Training Step - Loss: ${loss.toFixed(4)}, Accuracy: ${(accuracy * 100).toFixed(2)}%`
    );
    console.log("Per-test accuracies:", perTestAccuracies);
    return { loss, predictions, accuracy, perTestAccuracies };
  }

  /**
   * Run evaluation step
   */
  async evalStep(
    batch: LesionBatch
  ): Promise<{ loss: number; predictions: number[][]; accuracy: number }> {
    if (!this.initialized || !this.trainSession) {
      throw new Error("Model not initialized. Call init() first.");
    }
    const session = this.trainSession.get("training");
    if (!session) {
      toast("Training session not available.");
      throw new Error("No training session available.");
    }
    const feeds = {
      float_input: batch.features,
      labels: batch.labels,
    };

    const results = await session.runEvalStep(feeds);

    const loss = parseFloat(
      (results[this.metadata.lossNodeName!].data as string[])[0]
    );
    const predictions = this.extractPredictions(
      results["output"],
      batch.features.dims[0]
    );
    const accuracy = this.computeAccuracy(predictions, batch.labels);

    return { loss, predictions, accuracy };
  }

  /**
   * Extract predictions from model output
   */
  private extractPredictions(
    output: ortTrain.Tensor,
    batchSize: number
  ): number[][] {
    const predictions: number[][] = [];

    for (let i = 0; i < batchSize; i++) {
      const samplePreds: number[] = [];
      for (let j = 0; j < 4; j++) {
        samplePreds.push(Number((output as any).cpuData[i * 4 + j]));
      }
      predictions.push(samplePreds);
    }

    return predictions;
  }

  /**
   * Compute accuracy (exact match for all 4 tests)
   */
  private computeAccuracy(
    predictions: number[][],
    labels: ortTrain.Tensor
  ): number {
    let correct = 0;
    const batchSize = predictions.length;

    for (let i = 0; i < batchSize; i++) {
      let allMatch = true;
      for (let j = 0; j < 4; j++) {
        const pred = predictions[i][j] > 0 ? 1 : 0;
        if (pred !== Number((labels as any).cpuData[i * 4 + j])) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) correct++;
    }

    return correct / batchSize;
  }

  /**
   * Compute per-test accuracy
   */
  computePerTestAccuracy(
    allPredictions: number[][],
    allLabels: number[][]
  ): Record<string, number> {
    const accuracies: Record<string, number> = {};

    TEST_NAMES.forEach((testName, testIdx) => {
      let correct = 0;
      for (let i = 0; i < allPredictions.length; i++) {
        if (allPredictions[i][testIdx] === allLabels[i][testIdx]) {
          correct++;
        }
      }
      accuracies[testName] = correct / allPredictions.length;
    });

    return accuracies;
  }

  /**
   * Decode predictions to aphasia types for a batch
   */
  decodeBatchPredictions(predictions: number[][]): string[] {
    return predictions.map((pred) => this.decodeOutput(pred));
  }
}
