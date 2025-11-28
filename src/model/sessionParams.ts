import {
  SessionParameters,
  TrainSessionParameters,
} from "@/helpers/Interfaces";

export const SessionParams: SessionParameters = {
  numThreads: 1, // Set to 1 instead of 0 to avoid CPU vendor detection issues
  executionProviders: ["wasm"],
  memoryLimitMB: 0,
  cacheSizeMB: 2500,
  wasmRoot: new URL("./js/", document.baseURI).href,
};

export const TrainSessionParams: TrainSessionParameters = {
  numThreads: 1, // Set to 1 instead of 0 to avoid CPU vendor detection issues
  executionProviders: ["wasm"],
  memoryLimitMB: 0,
  cacheSizeMB: 2500,
  wasmRoot: new URL("./js/", document.baseURI).href,
  chkptPath: new URL(
    "https://object-store.rc.nectar.org.au/v1/AUTH_dead991e1fa847e3afcca2d3a7041f5d/deepsyence/onnx/checkpoint",
    document.baseURI
  ).href,
  trainingPath: new URL(
    "https://object-store.rc.nectar.org.au/v1/AUTH_dead991e1fa847e3afcca2d3a7041f5d/deepsyence/onnx/training_model.onnx",
    document.baseURI
  ).href,
  optimizerPath: new URL(
    "https://object-store.rc.nectar.org.au/v1/AUTH_dead991e1fa847e3afcca2d3a7041f5d/deepsyence/onnx/optimizer_model.onnx",
    document.baseURI
  ).href,
  evalPath: new URL(
    "https://object-store.rc.nectar.org.au/v1/AUTH_dead991e1fa847e3afcca2d3a7041f5d/deepsyence/onnx/eval_model.onnx",
    document.baseURI
  ).href,
};
