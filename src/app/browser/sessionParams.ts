export const SessionParams: SessionParameters = {
  numThreads: 0,
  executionProviders: ["wasm"],
  memoryLimitMB: 0,
  cacheSizeMB: 2500,
  wasmRoot: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.16.0/dist/",
};

export interface SessionParameters {
  numThreads: number;
  executionProviders: string[];
  memoryLimitMB: number;
  cacheSizeMB: number;
  wasmRoot: string;
}
