import { SessionParameters } from "@/helpers/Interfaces";

export const SessionParams: SessionParameters = {
  numThreads: 1, // Set to 1 instead of 0 to avoid CPU vendor detection issues
  executionProviders: ["wasm", "cpu", "webgl", "webgpu"],
  memoryLimitMB: 0,
  cacheSizeMB: 2500,
  wasmRoot: new URL("./js/", document.baseURI).href,
};
