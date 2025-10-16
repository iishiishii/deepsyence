// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import { Tensor } from "onnxruntime-web";

export interface modelScaleProps {
  samScale: number;
  height: number;
  width: number;
}

export interface modelInputProps {
  x: number;
  y: number;
  z: number;
  clickType: number;
}

export interface boundingBox {
  topLeft: modelInputProps;
  bottomRight: modelInputProps;
}

export interface modelDataProps {
  modelName: string;
  tensor: Tensor;
  modelScale: modelScaleProps;
  clicks?: modelInputProps[];
  bbox?: boundingBox;
}

export interface SAMResult {
  elapsed: number;
  embedding: Tensor[] | undefined;
}

export type UnetResult = {
  elapsed: number;
  mask: Uint8Array | undefined;
};

export interface PreprocessorResult {
  tensor: Tensor;
  newWidth: number;
  newHeight: number;
}

export interface SessionParameters {
  numThreads: number;
  executionProviders: string[];
  memoryLimitMB: number;
  cacheSizeMB: number;
  wasmRoot: string;
}
