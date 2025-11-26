import * as ort from "onnxruntime-web";

import { SessionParameters, SessionType } from "@/helpers/Interfaces";
import localforage from "localforage";

export const clearCache = async () => {
  await localforage.clear();
};

export class Session {
  ortSession: ort.InferenceSession | undefined;
  sessionType: SessionType;
  cacheSize: number;
  params: SessionParameters;

  constructor(sessionType: SessionType, params: SessionParameters) {
    this.sessionType = sessionType;
    this.params = params;
    const cacheSize = params.cacheSizeMB * 1e6;
    this.cacheSize = cacheSize;
    localforage.config({
      name: "DeepyenceModelCache",
      version: 1.0,
      driver: localforage.INDEXEDDB,
      storeName: "model_storage",
    });
  }

  // Factory methods for clean instantiation
  static createInferenceSession(params: SessionParameters): Session {
    return new Session("inference", params);
  }

  init = async (modelPath?: string) => {
    // Common configuration
    ort.env.wasm.numThreads = this.params.numThreads;
    ort.env.wasm.wasmPaths = this.params.wasmRoot;

    if (modelPath) {
      await this.initInferenceSession(modelPath);
    } else {
      throw new Error("Model path is required for inference sessions");
    }
  };

  private initInferenceSession = async (modelPath: string) => {
    const modelData = await this.fetchData(modelPath);
    const session = await ort.InferenceSession.create(modelData, {
      executionProviders: this.params.executionProviders,
      graphOptimizationLevel: "all",
      executionMode: "parallel",
    });
    this.ortSession = session;
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
    input: ort.InferenceSession.OnnxValueMapType
  ): Promise<ort.InferenceSession.OnnxValueMapType> => {
    if (!this.ortSession) {
      throw Error(
        "the session is not initialized. Call `init()` method first."
      );
    }

    const processedInput = this.processInputs(input);
    return await this.ortSession.run(processedInput);
  };

  // Extract input processing logic
  private processInputs(input: ort.InferenceSession.OnnxValueMapType): {
    [name: string]: ort.OnnxValue;
  } {
    const processedInput: { [name: string]: ort.OnnxValue } = {};

    for (const [key, value] of Object.entries(input)) {
      if (value && typeof value === "object" && (value as any)._isTensor) {
        // Reconstruct tensor from serialized data
        const serializedTensor = value as any;
        const tensor = new ort.Tensor(
          serializedTensor.type,
          serializedTensor.data,
          serializedTensor.dims
        );
        processedInput[key] = tensor;
      } else if (value instanceof ort.Tensor) {
        if (!value.data || value.data.length === 0) {
          throw new Error(
            `Tensor data for input "${key}" is undefined or empty.`
          );
        }
        processedInput[key] = value;
      } else {
        processedInput[key] = value as ort.OnnxValue;
      }
    }

    return processedInput;
  }

  inputNames = (): readonly string[] => {
    if (!this.ortSession) {
      throw Error(
        "the session is not initialized. Call `init()` method first."
      );
    }
    return this.ortSession.inputNames;
  };

  outputNames = (): readonly string[] => {
    if (!this.ortSession) {
      throw Error(
        "the session is not initialized. Call `init()` method first."
      );
    }
    return this.ortSession.outputNames;
  };

  release = () => {
    if (this.ortSession) {
      this.ortSession.release();
      this.ortSession = undefined;
    }
  };
}
