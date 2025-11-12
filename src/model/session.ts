import * as ort from "onnxruntime-web";
import { SessionParameters } from "@/helpers/Interfaces";
import localforage from "localforage";

export const clearCache = async () => {
  await localforage.clear();
};

export class Session {
  ortSession: ort.InferenceSession | undefined;
  cacheSize: number;
  params: SessionParameters;

  constructor(params: SessionParameters) {
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

  init = async (modelPath: string) => {
    ort.env.wasm.numThreads = this.params.numThreads;
    ort.env.wasm.wasmPaths = this.params.wasmRoot;
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

  run = async (
    input: ort.InferenceSession.OnnxValueMapType
  ): Promise<ort.InferenceSession.OnnxValueMapType> => {
    if (!this.ortSession) {
      throw Error(
        "the session is not initialized. Call `init()` method first."
      );
    }

    // Reconstruct tensors from serialized data if needed
    const processedInput: { [name: string]: ort.OnnxValue } = {};
    for (const [key, value] of Object.entries(input)) {
      if (value && typeof value === "object" && (value as any)._isTensor) {
        // Reconstruct tensor from serialized data
        const serializedTensor = value as any;
        // console.log(`Reconstructing tensor ${key} from serialized data`);
        // console.log(`Data:`, serializedTensor.data);
        // console.log(`Dims:`, serializedTensor.dims);
        // console.log(`Type:`, serializedTensor.type);

        const tensor = new ort.Tensor(
          serializedTensor.type,
          serializedTensor.data,
          serializedTensor.dims
        );
        processedInput[key] = tensor;
      } else if (value instanceof ort.Tensor) {
        // console.log(`Checking tensor ${key}:`, value);
        // console.log(`Tensor data for ${key}:`, value.data);
        // console.log(`Tensor dims for ${key}:`, value.dims);

        // Check if the tensor data is undefined or corrupted
        if (!value.data || value.data.length === 0) {
          throw new Error(
            `Tensor data for input "${key}" is undefined or empty. This usually happens when tensors are transferred through Comlink without proper handling.`
          );
        }
        processedInput[key] = value;
      } else {
        // console.log(`Input ${key} is not a tensor, passing as is.`);
        // console.log(`Data:`, value.data);
        // console.log(`Dims:`, value.dims);
        // console.log(`Type:`, value.type);
        processedInput[key] = value as ort.OnnxValue;
      }
    }

    return await this.ortSession.run(processedInput);
  };

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
