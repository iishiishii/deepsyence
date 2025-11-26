import * as ortTrain from "onnxruntime-web/training";
import { NVImage } from "@niivue/niivue";
import {
  APHASIA_ENCODING_MAP,
  PATTERN_TO_APHASIA,
} from "@/model/classificationModel";
import { toast } from "sonner";
import { StandardScaler } from "@/helpers//utils/standardScaler";
export interface SubjectData {
  lesionMask: NVImage;
  aphasiaType: string;
}

export interface ExtractedFeatures {
  lesionSize: number; // Count of non-zero voxels
}

export interface LesionBatch {
  features: ortTrain.Tensor; // Shape: [batchSize, 1] - [lesionSize]
  labels: ortTrain.Tensor; // Shape: [batchSize, 4] - [N, F, C, R]
}

export class MriData {
  static readonly BATCH_SIZE = 32;
  static readonly MAX_NUM_TRAIN_SAMPLES = 200;
  static readonly MAX_NUM_TEST_SAMPLES = 50;
  static readonly NUM_FEATURES = 1; // lesionSize
  static readonly NUM_OUTPUTS = 4; // Naming, Fluency, Comprehension, Repetition

  private trainingData: SubjectData[] = [];
  private testingData: SubjectData[] = [];
  private extractedTrainingFeatures: ExtractedFeatures[] = [];
  private extractedTestingFeatures: ExtractedFeatures[] = [];

  // Standard scaler for normalization
  public scaler: StandardScaler;
  private scalerFitted: boolean = false;

  constructor(
    public batchSize = MriData.BATCH_SIZE,
    public maxNumTrainSamples = MriData.MAX_NUM_TRAIN_SAMPLES,
    public maxNumTestSamples = MriData.MAX_NUM_TEST_SAMPLES
  ) {
    if (batchSize <= 0) {
      throw new Error("batchSize must be > 0");
    }
    this.scaler = new StandardScaler();
  }

  static parseAphasiaTypeFromFilename(filename: string): string | undefined {
    // Remove file extensions
    const nameWithoutExt = filename.replace(/\.(nii|nii\.gz)$/i, "");

    // Split by underscore
    const parts = nameWithoutExt.split("_");

    if (parts.length < 2) {
      toast(
        `Invalid filename format: "${filename}". Expected pattern: {subjectName}_{aphasiaType}`
      );
    }

    // Last part is aphasia type
    let aphasiaType = parts[parts.length - 1];
    // Validate aphasia type
    if (!APHASIA_ENCODING_MAP[aphasiaType]) {
      toast(
        `Unknown aphasia type "${aphasiaType}" in filename "${filename}". ` +
          `Valid types: ${Object.keys(APHASIA_ENCODING_MAP).join(", ")}`
      );
      return undefined;
    }

    return aphasiaType;
  }

  // ============================================================================
  // SUBJECT DATA CREATION
  // ============================================================================
  /**
   * Create SubjectData from NVImage (extracts info from filename)
   */
  static createSubjectFromImage(lesionMask: NVImage): SubjectData {
    const filename = lesionMask.name || lesionMask.url || "";

    if (!filename) {
      toast("NVImage must have a name or url property");
    }

    // Extract subject ID and aphasia type from filename
    const aphasiaType = this.parseAphasiaTypeFromFilename(filename);

    if (!aphasiaType) {
      throw new Error(
        `Failed to parse aphasia type from filename: ${filename}`
      );
    }
    return {
      lesionMask,
      aphasiaType,
    };
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  /**
   * Add training subject data
   */
  addTrainingSubject(lesionMask: NVImage): void {
    if (this.trainingData.length >= this.maxNumTrainSamples) {
      console.warn(
        `Max training samples (${this.maxNumTrainSamples}) reached. Skipping.`
      );
      return;
    }

    try {
      const subject = MriData.createSubjectFromImage(lesionMask);
      this.trainingData.push(subject);
      console.log(`Added training subject: (${subject.aphasiaType})`);
    } catch (err) {
      console.error(`Failed to add training subject: ${err}`);
    }
  }

  /**
   * Add testing subject data
   */
  addTestingSubject(lesionMask: NVImage): void {
    if (this.testingData.length >= this.maxNumTestSamples) {
      console.warn(
        `Max testing samples (${this.maxNumTestSamples}) reached. Skipping.`
      );
      return;
    }

    try {
      const subject = MriData.createSubjectFromImage(lesionMask);
      this.testingData.push(subject);
      console.log(`Added testing subject: (${subject.aphasiaType})`);
    } catch (err) {
      console.error(`Failed to add testing subject: ${err}`);
    }
  }

  /**
   * Load subjects from arrays
   */
  loadImages(trainingImages: NVImage[], testingImages: NVImage[]): void {
    console.log(`Loading ${trainingImages.length} training images...`);
    trainingImages.slice(0, this.maxNumTrainSamples).forEach((img) => {
      try {
        const subject = MriData.createSubjectFromImage(img);
        this.trainingData.push(subject);
      } catch (err) {
        console.error(`Skipping image: ${err}`);
      }
    });

    console.log(`Loading ${testingImages.length} testing images...`);
    testingImages.slice(0, this.maxNumTestSamples).forEach((img) => {
      try {
        const subject = MriData.createSubjectFromImage(img);
        this.testingData.push(subject);
      } catch (err) {
        console.error(`Skipping image: ${err}`);
      }
    });

    // Extract features immediately
    this.extractedTrainingFeatures = this.trainingData.map((s) =>
      this.extractFeatures(s)
    );
    this.extractedTestingFeatures = this.testingData.map((s) =>
      this.extractFeatures(s)
    );

    // Fit scaler on training data
    this.fitScaler();

    console.log(
      `Successfully loaded ${this.trainingData.length} training subjects`
    );
    console.log(
      `Successfully loaded ${this.testingData.length} testing subjects`
    );
  }

  // ============================================================================
  // LESION SIZE EXTRACTION
  // ============================================================================

  /**
   * Count non-zero voxels in the lesion mask (lesion size)
   */
  static countLesionVoxels(image: NVImage): number {
    if (!image.img) {
      throw new Error("Image data not loaded");
    }

    let count = 0;
    const data = image.img;

    for (let i = 0; i < data.length; i++) {
      if (data[i] !== 0) {
        count++;
      }
    }

    return count;
  }

  /**
   * Calculate lesion volume in mm³ (accounting for voxel dimensions)
   */
  static calculateLesionVolume(image: NVImage): number {
    const voxelCount = this.countLesionVoxels(image);

    // Get voxel dimensions from the image header
    const pixDims = image.pixDims || [1, 1, 1, 1];
    const voxelVolume = pixDims[1] * pixDims[2] * pixDims[3]; // mm³

    return voxelCount * voxelVolume;
  }

  /**
   * Get lesion statistics from an NVImage
   */
  static getLesionStats(image: NVImage): {
    voxelCount: number;
    volumeMm3: number;
    totalVoxels: number;
    percentageAffected: number;
  } {
    console.log("getting lesion stats for image", image);
    if (!image.img2RAS() || !image.dimsRAS) {
      throw new Error("Image data not loaded");
    }

    const voxelCount = this.countLesionVoxels(image);
    const volumeMm3 = this.calculateLesionVolume(image);
    const totalVoxels = image.dimsRAS[1] * image.dimsRAS[2] * image.dimsRAS[3];
    const percentageAffected = (voxelCount / totalVoxels) * 100;

    return {
      voxelCount,
      volumeMm3,
      totalVoxels,
      percentageAffected,
    };
  }

  /**
   * Extract all features from a subject
   */
  extractFeatures(subject: SubjectData): ExtractedFeatures {
    console.log("extracting features for subject", subject);
    const lesionStats = MriData.getLesionStats(subject.lesionMask);

    return {
      lesionSize: lesionStats.voxelCount,
    };
  }
  // ============================================================================
  // LABEL ENCODING
  // ============================================================================

  /**
   * Encode aphasia type to [N, F, C, R] binary array
   */
  static encodeAphasiaType(aphasiaType: string): number[] {
    const encoding = APHASIA_ENCODING_MAP[aphasiaType];
    if (!encoding) {
      console.warn(
        `Unknown aphasia type: ${aphasiaType}. Defaulting to 'None'.`
      );
      return APHASIA_ENCODING_MAP["None"];
    }
    return encoding;
  }

  /**
   * Decode [N, F, C, R] binary array to aphasia type
   */
  static decodeAphasiaType(predictions: number[]): string {
    const key = predictions.join(",");
    return PATTERN_TO_APHASIA[key] || "Unknown";
  }

  // ============================================================================
  // BATCH CREATION
  // ============================================================================

  fitScaler(): void {
    if (this.extractedTrainingFeatures.length === 0) {
      throw new Error("Cannot fit scaler: no training data available");
    }

    const lesionSizes = this.extractedTrainingFeatures.map((f) => f.lesionSize);
    this.scaler.fit(lesionSizes);
    this.scalerFitted = true;
  }

  /**
   * Create a single batch from extracted features
   */
  private createBatch(
    features: ExtractedFeatures[],
    subjects: SubjectData[],
    startIdx: number,
    batchSize: number
  ): LesionBatch {
    const actualBatchSize = Math.min(batchSize, features.length - startIdx);

    // Create features tensor: [batchSize, 1] - only lesionSize
    const featureData = new Float32Array(
      actualBatchSize * MriData.NUM_FEATURES
    );

    // Create labels tensor: [batchSize, 4]
    const labelData = new Float32Array(actualBatchSize * MriData.NUM_OUTPUTS);

    for (let i = 0; i < actualBatchSize; i++) {
      const idx = startIdx + i;
      const feat = features[idx];
      const subj = subjects[idx];

      // Features: [lesionSize]
      featureData[i] = feat.lesionSize;

      // Labels: [N, F, C, R]
      const encoding = MriData.encodeAphasiaType(subj.aphasiaType);
      for (let j = 0; j < MriData.NUM_OUTPUTS; j++) {
        labelData[i * MriData.NUM_OUTPUTS + j] = encoding[j];
      }
    }

    // Apply scaling if enabled and scaler is fitted
    let scaledFeatureData = featureData;
    if (this.scalerFitted) {
      scaledFeatureData = this.scaler.transform(featureData);
    }

    return {
      features: new ortTrain.Tensor("float32", scaledFeatureData, [
        actualBatchSize,
        MriData.NUM_FEATURES,
      ]),
      labels: new ortTrain.Tensor("float32", labelData, [
        actualBatchSize,
        MriData.NUM_OUTPUTS,
      ]),
    };
  }

  // ============================================================================
  // BATCH GENERATORS
  // ============================================================================

  getNumTrainingBatches(): number {
    return Math.ceil(this.trainingData.length / this.batchSize);
  }

  getNumTestBatches(): number {
    return Math.ceil(this.testingData.length / this.batchSize);
  }

  /**
   * Generator for training batches
   */
  *trainingBatches(): Generator<LesionBatch> {
    if (this.extractedTrainingFeatures.length === 0) {
      this.extractedTrainingFeatures = this.trainingData.map((s) =>
        this.extractFeatures(s)
      );
    }

    for (let i = 0; i < this.trainingData.length; i += this.batchSize) {
      yield this.createBatch(
        this.extractedTrainingFeatures,
        this.trainingData,
        i,
        this.batchSize
      );
    }
  }

  /**
   * Generator for testing batches
   */
  *testingBatches(): Generator<LesionBatch> {
    if (this.extractedTestingFeatures.length === 0) {
      this.extractedTestingFeatures = this.testingData.map((s) =>
        this.extractFeatures(s)
      );
    }

    for (let i = 0; i < this.testingData.length; i += this.batchSize) {
      yield this.createBatch(
        this.extractedTestingFeatures,
        this.testingData,
        i,
        this.batchSize
      );
    }
  }

  /**
   * Get all training data as a single batch (useful for small datasets)
   */
  getAllTrainingData(): LesionBatch {
    if (this.extractedTrainingFeatures.length === 0) {
      this.extractedTrainingFeatures = this.trainingData.map((s) =>
        this.extractFeatures(s)
      );
    }
    return this.createBatch(
      this.extractedTrainingFeatures,
      this.trainingData,
      0,
      this.trainingData.length
    );
  }

  /**
   * Get all testing data as a single batch
   */
  getAllTestingData(): LesionBatch {
    if (this.extractedTestingFeatures.length === 0) {
      this.extractedTestingFeatures = this.testingData.map((s) =>
        this.extractFeatures(s)
      );
    }
    return this.createBatch(
      this.extractedTestingFeatures,
      this.testingData,
      0,
      this.testingData.length
    );
  }

  /**
   * Get feature statistics for normalization
   */
  getFeatureStatistics(): {
    mean: number[];
    std: number[];
    min: number[];
    max: number[];
  } {
    const features = this.extractedTrainingFeatures;
    if (features.length === 0) {
      throw new Error("No training data available for statistics");
    }

    const lesionSizes = features.map((f) => f.lesionSize);

    const mean = lesionSizes.reduce((a, b) => a + b, 0) / lesionSizes.length;
    const std = Math.sqrt(
      lesionSizes.reduce((a, b) => a + (b - mean) ** 2, 0) / lesionSizes.length
    );
    const min = Math.min(...lesionSizes);
    const max = Math.max(...lesionSizes);

    return {
      mean: [mean],
      std: [std],
      min: [min],
      max: [max],
    };
  }

  /**
   * Get label distribution
   */
  getLabelDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const subject of this.trainingData) {
      distribution[subject.aphasiaType] =
        (distribution[subject.aphasiaType] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Clear all loaded data
   */
  clear(): void {
    this.trainingData = [];
    this.testingData = [];
    this.extractedTrainingFeatures = [];
    this.extractedTestingFeatures = [];
  }
}
