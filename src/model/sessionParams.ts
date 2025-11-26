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
  chkptPath: new URL("./model/aphasia_classifier/checkpoint", document.baseURI)
    .href,
  trainingPath: new URL(
    "./model/aphasia_classifier/training_model.onnx",
    document.baseURI
  ).href,
  optimizerPath: new URL(
    "./model/aphasia_classifier/optimizer_model.onnx",
    document.baseURI
  ).href,
  evalPath: new URL(
    "./model/aphasia_classifier/eval_model.onnx",
    document.baseURI
  ).href,
};
