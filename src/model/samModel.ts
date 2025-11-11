/* eslint-disable */
import * as ort from "onnxruntime-web";
import { BaseImageModel } from "@/model/base";
import { boundingBox, modelInputProps, SAMResult } from "@/helpers/Interfaces";
import { modelData } from "@/helpers/onnxModelAPI";
import { maskImage } from "@/helpers/utils/maskHandlers";
import { NVImage } from "@niivue/niivue";
import { toast } from "sonner";
export class SegmentAnythingModel extends BaseImageModel {
  // ✅ Store only volume ID, not the entire volume object
  private lastProcessedVolumeId: string | null = null;
  private volumeDimensions: [number, number, number] | null = null;

  // ✅ Use Maps for sparse storage (only store processed slices)
  private encoderResultCache: Map<number, ort.Tensor> = new Map();
  private maxCachedSlices: number = 32; // LRU cache limit
  private sliceAccessOrder: number[] = []; // For LRU tracking
  private volumeMask: Uint8Array | null = null;
  samScale: number = 1;

  private slicesPerEmbedding: number = 5; // Number of slices sharing one embedding
  private sliceToEmbeddingMap: Map<number, number> = new Map(); // Map sliceId to embeddingId

  private getEmbeddingId(sliceId: number): number {
    const embeddingId = Math.floor(sliceId / this.slicesPerEmbedding);
    const centerOffset = Math.floor(this.slicesPerEmbedding / 2);
    return embeddingId * this.slicesPerEmbedding + centerOffset;
  }

  private getEmbeddingForSlice(sliceId: number): ort.Tensor | null {
    const embeddingId = this.getEmbeddingId(sliceId);
    this.sliceToEmbeddingMap.set(sliceId, embeddingId);

    return this.encoderResultCache.get(embeddingId) || null;
  }

  private hasEmbeddingForSlice(sliceId: number): boolean {
    const embeddingId = this.getEmbeddingId(sliceId);
    return this.encoderResultCache.has(embeddingId);
  }

  process = async (
    volume: NVImage,
    sliceId: number
  ): Promise<SAMResult | undefined> => {
    const start = new Date();
    // let embedding: Float32Array | undefined;
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      throw Error("the model is not initialized");
    }
    if (volume !== undefined) {
      console.log("input ", volume);
      const volumeId = volume.id || volume.name;
      if (this.lastProcessedVolumeId !== volumeId) {
        // Clear old data before processing new volume
        this.clearCaches();

        this.preprocessor.processVolume(volume);
        this.lastProcessedVolumeId = volumeId;

        this.volumeDimensions = [
          volume.dimsRAS![1],
          volume.dimsRAS![2],
          volume.dimsRAS![3],
        ];

        const [width, height, depth] = this.volumeDimensions;
        this.volumeMask = new Uint8Array(width * height * depth);
      }
      await this.processEncoder(sliceId);
    } else {
      console.log("didnt run encoder ", volume);
    }

    if (this.encoderResultCache.size === 0 && volume === undefined) {
      toast("you must provide an image as an input");
    }
    if (volume === undefined) {
      return undefined;
    }
    const sliceEmbedding = this.getEmbeddingForSlice(sliceId);

    const end = new Date();
    const elapsed = (end.getTime() - start.getTime()) / 1000;
    const result: SAMResult = {
      embedding: sliceEmbedding ? [sliceEmbedding!] : [],
      elapsed: elapsed,
    };
    console.log("result ", result);
    return result;
  };

  processEncoder = async (sliceId: number) => {
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      throw Error("the model is not initialized");
    }

    const embeddingId = this.getEmbeddingId(sliceId);

    if (this.encoderResultCache.has(embeddingId)) {
      console.log(`Using cached encoder result for slice ${sliceId}`);
      this.updateLRU(embeddingId);
      this.sliceToEmbeddingMap.set(sliceId, embeddingId);
      return;
    }

    const start = new Date();
    const result = await this.preprocessor.process(embeddingId);

    const session = this.sessions.get("encoder");
    if (!session) {
      throw Error("the encoder is absent in the sessions map");
    }
    const inputData = await session.inputNames();
    console.log("session ", session);
    const inputName = inputData[0];

    const feeds = {
      [inputName]: result.tensor,
    };
    // feeds[inputData[0]] = result.tensor;
    console.log("feeds ", feeds);
    this.samScale =
      result.newHeight /
      Math.max(this.preprocessor.dims[0], this.preprocessor.dims[1]);

    try {
      const outputData: ort.InferenceSession.OnnxValueMapType =
        await session.run(feeds);
      const outputNames = await session.outputNames();
      const output: ort.Tensor = new ort.Tensor(
        "float32",
        outputData[outputNames[0]].cpuData as Float32Array,
        outputData[outputNames[0]].dims
      );
      this.encoderResultCache.set(embeddingId, output);
      const end = new Date();
      const inferenceTime = end.getTime() - start.getTime();
      console.log("inference time ", inferenceTime);

      console.log("output ", this.encoderResultCache.has(embeddingId));
      this.updateLRU(embeddingId);
      this.evictOldSlicesIfNeeded();
      console.log(
        "output sum ",
        (output.cpuData as Float32Array).reduce(
          (a: number, b: number) => a + b,
          0
        )
      );
    } catch (e) {
      console.log(`failed to inference ONNX model: ${e}. `);
    }
  };

  processDecoder = async (
    // image: any,
    sliceId: number,
    clicks: modelInputProps[],
    bbox: boundingBox | null
  ) => {
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      console.log("the model is not initialized");
      throw Error("the model is not initialized");
    }

    const embeddingId = this.getEmbeddingId(sliceId);
    if (!this.encoderResultCache.has(embeddingId)) {
      throw Error(
        `Encoder result for slice ${sliceId} is not available. Run encoder first.`
      );
    }

    if (!this.volumeDimensions || !this.volumeMask) {
      throw Error("Volume not initialized");
    }

    const start = new Date();

    // const LONG_SIDE_LENGTH = 1024;
    const [height, width, depth] = this.volumeDimensions!;
    const modelScale = {
      samScale: this.samScale,
      height: height, // swap height and width to get row major order from npy arrayt to column order ?
      width: width,
    };
    const session = this.sessions.get("decoder");
    if (!session) {
      console.log("the decoder is absent in the sessions map");
      throw Error("the decoder is absent in the sessions map");
    }
    const outputData = await session.outputNames();
    const modelName = this.metadata.id;
    const originalTensor: ort.Tensor =
      this.encoderResultCache.get(embeddingId)!;
    const originalData = originalTensor.cpuData as Float32Array;
    const cloneData = new Float32Array(originalData);
    // Clone tensor to avoid detachment issues with Comlink
    const tensor = new ort.Tensor("float32", cloneData, originalTensor.dims);
    console.log(
      "decoder tensor",
      originalTensor,
      tensor,
      this.encoderResultCache.get(embeddingId),
      sliceId
    );
    // Check if tensor exists and has been processed
    if (!tensor || tensor.size === 1) {
      throw Error(
        `Encoder result for slice ${sliceId} is not available or not processed yet`
      );
    }
    // prepare feeds. use model input names as keys
    let feeds;
    if (this.metadata.id === "efficient-sam") {
      feeds = modelData({
        modelName,
        tensor,
        modelScale,
        clicks,
      });
    } else {
      if (!bbox) {
        let topLeft = { x: 0, y: 0, z: 0, clickType: 2 };
        let bottomRight = {
          x: height,
          y: width,
          z: 0,
          clickType: 3,
        };
        bbox = { topLeft, bottomRight };
      }
      feeds = modelData({
        modelName,
        tensor,
        modelScale,
        clicks,
        bbox,
      });
    }

    console.log("feeds ", feeds, modelScale, bbox);
    if (feeds === undefined) return;

    try {
      // feed inputs and run
      let results = await session.run(feeds);
      // let mask = new Uint8Array(width * height * depth);
      const end = new Date();
      const inferenceTime = end.getTime() - start.getTime();
      console.log("inference time ", inferenceTime);

      let output = results[outputData[0]].cpuData;
      console.log("output data", results[outputData[0]], output);
      // console.log(
      //   "decoder output",
      //   (output as Float32Array).reduce((a, b) => a + b, 0)
      // );
      // console.log("output ", maxIou, (output as Float32Array).reduce((a, b) => a + b, 0));

      maskImage(
        output as Float32Array,
        width,
        height,
        clicks.slice(-1)[0].z, // get the last click slice
        this.volumeMask
      );

      // this.decoderResultCache.set(sliceId, this.volumeMask);
      console.log(
        "decoder mask sum ",
        this.volumeMask.reduce((a: number, b: number) => a + b, 0)
      );
      // return rasImage;
    } catch (e) {
      console.log(`failed to inference ONNX model: ${e}. `);
      throw Error(`failed to inference ONNX model: ${e}. `);
    }
  };

  /**
   * ✅ Return direct reference to volume mask (no copy)
   */
  getDecoderResultAsUint8Array(): Uint8Array {
    if (!this.volumeMask || this.volumeMask.length === 0) {
      return new Uint8Array(0);
    }

    // ✅ Return reference, not copy!
    return this.volumeMask;
  }

  // /**
  //  * ✅ Get single slice result (zero-copy view)
  //  */
  // getSliceResult(sliceId: number): Uint8Array {
  //   if (!this.volumeMask || !this.volumeDimensions) {
  //     return new Uint8Array(0);
  //   }

  //   const [width, height] = this.volumeDimensions;
  //   const sliceSize = width * height;
  //   const offset = sliceId * sliceSize;

  //   // ✅ Return view, not copy
  //   return this.volumeMask.subarray(offset, offset + sliceSize);
  // }

  /**
   * ✅ LRU cache management
   */
  private updateLRU(sliceId: number): void {
    // Remove if exists
    const index = this.sliceAccessOrder.indexOf(sliceId);
    if (index > -1) {
      this.sliceAccessOrder.splice(index, 1);
    }
    // Add to end (most recently used)
    this.sliceAccessOrder.push(sliceId);
  }

  private evictOldSlicesIfNeeded(): void {
    while (this.encoderResultCache.size > this.maxCachedSlices) {
      const oldestSlice = this.sliceAccessOrder.shift();
      if (oldestSlice !== undefined) {
        // Clean up tensor
        const tensor = this.encoderResultCache.get(oldestSlice);
        if (tensor) {
          // Force cleanup
          (tensor as any).cpuData = null;
        }
        this.encoderResultCache.delete(oldestSlice);
        console.log(`Evicted encoder cache for slice ${oldestSlice}`);
      }
    }
  }

  /**
   * ✅ Clear all caches
   */
  private clearCaches(): void {
    // Clean up encoder results
    this.encoderResultCache.forEach((tensor) => {
      (tensor as any).cpuData = null;
    });
    this.encoderResultCache.clear();

    // Reset LRU tracking
    this.sliceAccessOrder = [];

    // Clear volume mask
    if (this.volumeMask) {
      this.volumeMask = null;
    }
  }

  dispose = () => {
    if (this.sessions) {
      this.sessions.forEach(async (session) => {
        await session.release();
      });
    }

    if (this.preprocessor) {
      this.preprocessor.dispose();
    }

    this.clearCaches();

    this.initialized = false;
    this.lastProcessedVolumeId = null;
    this.volumeDimensions = null;
    this.samScale = 1;
  };
}
