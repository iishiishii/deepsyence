/* eslint-disable camelcase*/
// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import { Tensor } from "onnxruntime-web";
import { modeDataProps } from "./Interfaces";

const modelData = ({ clicks, bbox, tensor, modelScale }: modeDataProps) => {
  const imageEmbedding = tensor;
  let pointCoordsTensor;
  let pointLabelsTensor;
  let pointCoords;
  let pointLabels;

  const widthScale =
    Math.floor(modelScale.width * modelScale.samScale + 0.5) / modelScale.width;
  const heightScale =
    Math.floor(modelScale.height * modelScale.samScale + 0.5) /
    modelScale.height;

  // console.log(
  //   "clicks",
  //   clicks,
  //   "tensor",
  //   tensor,
  //   "modelScale",
  //   modelScale,
  //   "bbox",
  //   bbox,
  // );
  // Check there are input click prompts
  if (clicks) {
    let clickLength = clicks.length;
    const padding = bbox ? 2 : 1;
    pointCoords = new Float32Array(2 * (clickLength + padding));
    pointLabels = new Float32Array(clickLength + padding);
    // If there is no box input, a single padding point with
    // label -1 and coordinates (0.0, 0.0) should be concatenated
    // so initialize the array to support (n + 1) points.

    // Add clicks and scale to what SAM expects
    for (let i = 0; i < clickLength; i++) {
      pointCoords[2 * i] = clicks[i].x * widthScale;
      pointCoords[2 * i + 1] = clicks[i].y * heightScale;
      pointLabels[i] = clicks[i].clickType;
    }

    if (bbox) {
      // console.log("bbox loop", bbox);
      pointCoords[2 * clickLength] = bbox.topLeft.x * widthScale;
      pointCoords[2 * clickLength + 1] = bbox.topLeft.y * heightScale;
      pointLabels[clickLength] = bbox.topLeft.clickType;
      pointCoords[2 * clickLength + 2] = bbox.bottomRight.x * widthScale;
      pointCoords[2 * clickLength + 3] = bbox.bottomRight.y * heightScale;
      pointLabels[clickLength + 1] = bbox.bottomRight.clickType;
    } else {
      // Add in the extra point/label when only clicks and no box
      // The extra point is at (0, 0) with label -1
      pointCoords[2 * clickLength] = 0.0;
      pointCoords[2 * clickLength + 1] = 0.0;
      pointLabels[clickLength] = -1.0;
    }
    // console.log("bbox length", pointCoords, pointLabels);

    // Create the tensor
    pointCoordsTensor = new Tensor("float32", pointCoords, [
      1,
      clickLength + padding,
      2,
    ]);
    pointLabelsTensor = new Tensor("float32", pointLabels, [
      1,
      clickLength + padding,
    ]);
  }

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
