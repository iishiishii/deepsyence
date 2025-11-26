import * as ortTrain from "onnxruntime-web/training";

import { TrainSessionParameters, SessionType } from "@/helpers/Interfaces";
import localforage from "localforage";

export const clearCache = async () => {
  await localforage.clear();
};

export class TrainSession {
  ortSession: ortTrain.TrainingSession | undefined;
  sessionType: SessionType;
  cacheSize: number;
  params: TrainSessionParameters;

  constructor(sessionType: SessionType, params: TrainSessionParameters) {
    this.sessionType = sessionType;
    this.params = params;
    const cacheSize = params.cacheSizeMB * 1e6;
    this.cacheSize = cacheSize;
    localforage.config({
      name: "DeepyenceTrainingModelCache",
      version: 1.0,
      driver: localforage.INDEXEDDB,
      storeName: "model_storage_training",
    });
  }

  init = async () => {
    // Common configuration
    ortTrain.env.wasm.numThreads = this.params.numThreads;
    ortTrain.env.wasm.wasmPaths = this.params.wasmRoot;
    console.log("init training session");
    try {
      await this.initTrainingSession();
    } catch (error) {
      console.error("Error initializing training session:", error);
      throw error;
    }
  };

  private initTrainingSession = async () => {
    const trainingParams = this.params as TrainSessionParameters;
    console.log("init training session", trainingParams);
    // Fetch all required model files
    const [chkptData, trainingData, optimizerData, evalData] =
      await Promise.all([
        this.fetchData(trainingParams.chkptPath),
        this.fetchData(trainingParams.trainingPath),
        this.fetchData(trainingParams.optimizerPath),
        this.fetchData(trainingParams.evalPath),
      ]);

    const createOptions: ortTrain.TrainingSessionCreateOptions = {
      checkpointState: new Uint8Array(chkptData),
      trainModel: new Uint8Array(trainingData),
      evalModel: new Uint8Array(evalData),
      optimizerModel: new Uint8Array(optimizerData),
    };

    const sessionOptions = {
      executionProviders: this.params.executionProviders,
      graphOptimizationLevel: "all" as const,
      executionMode: "parallel" as const,
    };
    console.log("create training session", createOptions, sessionOptions);
    let session: ortTrain.TrainingSession;

    // Create training session with evaluation model
    session = await ortTrain.TrainingSession.create(
      createOptions,
      sessionOptions
    );
    console.log("training session created", session);
    this.ortSession = session;
  };

  // Training-specific methods
  runTrainStep = async (
    feedsInputs: ortTrain.InferenceSession.OnnxValueMapType
  ) => {
    console.log("runTrainStep called");
    if (!this.ortSession) {
      throw new Error(
        "the session is not initialized. Call `init()` method first."
      );
    }
    let runTrainOptions: ortTrain.InferenceSession.RunOptions = {
      logSeverityLevel: 0,
      logVerbosityLevel: 2,
    };

    console.log("feedsInputs", feedsInputs);
    // const processedInputs = this.processInputs(feedsInputs);
    try {
      let results = await this.ortSession.runTrainStep(
        feedsInputs
        // runTrainOptions
      );
      console.log("train step results", results);
      await this.ortSession.runOptimizerStep();
      await this.ortSession.lazyResetGrad();
      return results;
    } catch (error) {
      console.error("Error during runTrainStep:", error);
      throw error;
    }
  };

  runEvalStep = async (
    feeds: ortTrain.InferenceSession.OnnxValueMapType
  ): Promise<ortTrain.InferenceSession.OnnxValueMapType> => {
    if (!this.ortSession) {
      throw new Error("runEvalStep can only be called on training sessions");
    }

    const processedInputs = this.processInputs(feeds);
    return await this.ortSession.runEvalStep(processedInputs);
  };

  fetchData = async (modelPath: string): Promise<ArrayBuffer> => {
    let modelData = await fetch(modelPath).then((resp) => resp.arrayBuffer());
    if (modelData.byteLength > this.cacheSize) {
      console.warn("the model is too large to be cached");
    } else {
      await this.validateCache(modelData);
      localforage.setItem(modelPath, modelData);
    }
    return modelData;
  };

  validateCache = async (modelData: ArrayBuffer) => {
    try {
      const cacheKeys = await localforage.keys();
      let cacheSize = 0;
      const cacheItemSizes = new Map<string, number>();
      for (const key of cacheKeys) {
        const data = (await localforage.getItem(key)) as ArrayBuffer;
        cacheSize += data.byteLength;
        cacheItemSizes.set(key, data.byteLength);
      }
      let newCacheSize = cacheSize + modelData.byteLength;
      while (newCacheSize > this.cacheSize) {
        const [key, size] = cacheItemSizes.entries().next().value!;
        cacheItemSizes.delete(key);
        newCacheSize -= size;
        await localforage.removeItem(key);
      }
    } catch (err) {
      console.error("unable to validate the cache");
      console.error(err);
    }
  };

  // Enhanced run method that works for both session types
  run = async (
    input: ortTrain.InferenceSession.OnnxValueMapType
  ): Promise<ortTrain.InferenceSession.OnnxValueMapType> => {
    if (!this.ortSession) {
      throw Error(
        "the session is not initialized. Call `init()` method first."
      );
    }

    const processedInput = this.processInputs(input);

    // For training sessions, use the inference run (not training step)
    return await this.runTrainStep(processedInput);
  };

  // Extract input processing logic
  private processInputs(input: ortTrain.InferenceSession.OnnxValueMapType): {
    [name: string]: ortTrain.OnnxValue;
  } {
    const processedInput: { [name: string]: ortTrain.OnnxValue } = {};

    for (const [key, value] of Object.entries(input)) {
      if (value && typeof value === "object" && (value as any)._isTensor) {
        // Reconstruct tensor from serialized data
        const serializedTensor = value as any;
        const tensor = new ortTrain.Tensor(
          serializedTensor.type,
          serializedTensor.data,
          serializedTensor.dims
        );
        processedInput[key] = tensor;
      } else if (value instanceof ortTrain.Tensor) {
        if (!value.data || value.data.length === 0) {
          throw new Error(
            `Tensor data for input "${key}" is undefined or empty.`
          );
        }
        processedInput[key] = value;
      } else {
        processedInput[key] = value as ortTrain.OnnxValue;
      }
    }

    return processedInput;
  }

  // Training-specific input/output names
  trainInputNames = (): readonly string[] => {
    if (!this.ortSession) {
      throw new Error(
        "trainInputNames can only be called on training sessions"
      );
    }
    return this.ortSession.trainingInputNames;
  };

  trainOutputNames = (): readonly string[] => {
    if (!this.ortSession) {
      throw new Error(
        "trainOutputNames can only be called on training sessions"
      );
    }
    return this.ortSession.trainingOutputNames;
  };

  evalInputNames = (): readonly string[] => {
    if (!this.ortSession) {
      throw new Error("evalInputNames can only be called on training sessions");
    }
    return this.ortSession.evalInputNames;
  };

  evalOutputNames = (): readonly string[] => {
    if (!this.ortSession) {
      throw new Error(
        "evalOutputNames can only be called on training sessions"
      );
    }
    return this.ortSession.evalOutputNames;
  };

  release = () => {
    if (this.ortSession) {
      this.ortSession.release();
      this.ortSession = undefined;
    }
  };
}
