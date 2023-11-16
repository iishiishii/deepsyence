/* eslint-disable camelcase*/
// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import { Tensor } from "onnxruntime-web";
import { modeDataProps } from "./Interfaces";

const modelData = ({ clicks, boxes, tensor, modelScale }: modeDataProps) => {
  const imageEmbedding = tensor;
  let pointCoords;
  let pointLabels;
  let pointCoordsTensor;
  let pointLabelsTensor;
  let n = clicks!.length;

  const widthScale =
    (modelScale.width * modelScale.samScale + 0.5) / modelScale.width;
  const heightScale =
    (modelScale.height * modelScale.samScale + 0.5) / modelScale.height;
  console.log(
    "clicks",
    clicks,
    "tensor",
    tensor,
    "modelScale",
    modelScale,
    "boxes",
    boxes,
  );
  // Check there are input click prompts
  if (clicks) {
    // If there is no box input, a single padding point with
    // label -1 and coordinates (0.0, 0.0) should be concatenated
    // so initialize the array to support (n + 1) points.
    pointCoords = new Float32Array(2 * (n + 2));
    pointLabels = new Float32Array(n + 2);

    // Add clicks and scale to what SAM expects
    for (let i = 0; i < n; i++) {
      pointCoords[2 * i] = clicks[i].x * widthScale;
      pointCoords[2 * i + 1] = clicks[i].y * heightScale;
      pointLabels[i] = clicks[i].clickType;
    }
  }
  if (boxes) {
    for (const box of boxes) {
      for (let i = n; i < n + box.length; i++) {
        pointCoords[2 * i] = box[i - n].x * widthScale;
        pointCoords[2 * i + 1] = box[i - n].y * heightScale;
        pointLabels[i] = 2 + i - n;
      }
    }
  } else {
    // Add in the extra point/label when only clicks and no box
    // The extra point is at (0, 0) with label -1
    pointCoords[2 * n] = 0.0;
    pointCoords[2 * n + 1] = 0.0;
    pointLabels[n] = -1.0;
  }

  // Create the tensor
  pointCoordsTensor = new Tensor("float32", pointCoords, [1, n + 2, 2]);
  pointLabelsTensor = new Tensor("float32", pointLabels, [1, n + 2]);

  const imageSizeTensor = new Tensor("float32", [
    modelScale.height,
    modelScale.width,
  ]);

  if (pointCoordsTensor === undefined || pointLabelsTensor === undefined)
    return;

  // There is no previous mask, so default to an empty tensor
  const maskInput = new Tensor(
    "float32",
    new Float32Array(256 * 256),
    [1, 1, 256, 256],
  );
  // There is no previous mask, so default to 0
  const hasMaskInput = new Tensor("float32", [0]);

  return {
    image_embeddings: imageEmbedding,
    point_coords: pointCoordsTensor,
    point_labels: pointLabelsTensor,
    orig_im_size: imageSizeTensor,
    mask_input: maskInput,
    has_mask_input: hasMaskInput,
  };
};

export { modelData };
