// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import { Tensor } from "onnxruntime-web";
import { ModelType } from "../types";

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

export interface modeDataProps {
  modelName: string;
  clicks?: modelInputProps[];
  bbox?: boundingBox;
  tensor: Tensor;
  modelScale: modelScaleProps;
}

export interface SAMResult {
  elapsed: number;
  embedding: Tensor[] | undefined;
};

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

export interface Metadata {
  id: string;
  memEstimateMB: number;
  title?: string;
  description?: string;
  sizeMB?: number;
  tags?: string[];
  referenceURL?: string;
};

export type ImageMetadata = Metadata & {
  type?: ModelType;
  modelPaths: Map<string, string>;
  configPath?: string;
  preprocessorPath: string;
  examples?: string[];
};

export interface ModelSelectorProps {
  tags: string[] | undefined;
  imageType?: ModelType[];
  callback: (id: string) => void;
}