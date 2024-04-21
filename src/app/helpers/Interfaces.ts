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

export interface modeDataProps {
  modelName: string;
  clicks?: modelInputProps[];
  bbox?: boundingBox;
  tensor: Tensor;
  modelScale: modelScaleProps;
}
