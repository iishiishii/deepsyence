import * as ort from "onnxruntime-web";
import { SessionParameters } from "@/helpers/Interfaces";

export class Session {
  ortSession: ort.InferenceSession | undefined;
  cacheSize: number;
  params: SessionParameters;

  constructor(params: SessionParameters) {
    this.params = params;
    const cacheSize = params.cacheSizeMB * 1e6;
    this.cacheSize = cacheSize;
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
    const extension = modelPath.split(".").pop();
    let modelData = await fetch(modelPath).then((resp) => resp.arrayBuffer());
    return modelData;
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
      if (value && typeof value === 'object' && (value as any)._isTensor) {
        // Reconstruct tensor from serialized data
        const serializedTensor = value as any;
        console.log(`Reconstructing tensor ${key} from serialized data`);
        console.log(`Data:`, serializedTensor.data);
        console.log(`Dims:`, serializedTensor.dims);
        console.log(`Type:`, serializedTensor.type);
        
        const tensor = new ort.Tensor(serializedTensor.type, serializedTensor.data, serializedTensor.dims);
        processedInput[key] = tensor;
      } else if (value instanceof ort.Tensor) {
        console.log(`Checking tensor ${key}:`, value);
        console.log(`Tensor data for ${key}:`, value.data);
        console.log(`Tensor dims for ${key}:`, value.dims);
        
        // Check if the tensor data is undefined or corrupted
        if (!value.data || value.data.length === 0) {
          throw new Error(`Tensor data for input "${key}" is undefined or empty. This usually happens when tensors are transferred through Comlink without proper handling.`);
        }
        processedInput[key] = value;
      } else {
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
}
