/* eslint-disable camelcase*/
// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import { Tensor } from "onnxruntime-web";
import { modelDataProps } from "@/helpers/Interfaces";

const modelData = ({
  modelName,
  tensor,
  modelScale,
  clicks,
  bbox,
}: modelDataProps) => {
  // const imageEmbedding = new Tensor("float32", tensor.data, tensor.dims);
  // console.log("image embedding", tensor);
  let pointCoordsTensor;
  let pointLabelsTensor;
  let pointCoords;
  let pointLabels;

  const originalWidth = modelScale.originalWidth || modelScale.width;
  const originalHeight = modelScale.originalHeight || modelScale.height;
  const finalSize = modelScale.finalSize || 1024;

  // Calculate resize scale (longest side scales to finalSize)
  const longestOriginalSide = Math.max(originalWidth, originalHeight);
  const resizeScale = finalSize / longestOriginalSide;

  // Calculate resized dimensions (before padding)
  const resizedWidth = originalWidth * resizeScale;
  const resizedHeight = originalHeight * resizeScale;

  // Calculate padding offsets
  const paddingLeft = (finalSize - resizedWidth) / 2;
  const paddingTop = (finalSize - resizedHeight) / 2;

  if (clicks) {
    let clickLength = clicks.length;
    const padding = bbox ? 2 : 0;
    pointCoords = new Float32Array(2 * (clickLength + padding));
    pointLabels = new Float32Array(clickLength + padding);

    // Transform coordinates: original → resized → padded
    for (let i = 0; i < clickLength; i++) {
      pointCoords[2 * i] = clicks[i].x * resizeScale + paddingLeft;
      pointCoords[2 * i + 1] = clicks[i].y * resizeScale + paddingTop;
      pointLabels[i] = clicks[i].clickType;

      console.log(
        `Click ${i}: (${clicks[i].x}, ${clicks[i].y}) → (${pointCoords[2 * i].toFixed(1)}, ${pointCoords[2 * i + 1].toFixed(1)})`
      );
    }

    if (bbox) {
      pointCoords[2 * clickLength] = bbox.topLeft.x * resizeScale + paddingLeft;
      pointCoords[2 * clickLength + 1] =
        bbox.topLeft.y * resizeScale + paddingTop;
      pointLabels[clickLength] = bbox.topLeft.clickType;

      pointCoords[2 * clickLength + 2] =
        bbox.bottomRight.x * resizeScale + paddingLeft;
      pointCoords[2 * clickLength + 3] =
        bbox.bottomRight.y * resizeScale + paddingTop;
      pointLabels[clickLength + 1] = bbox.bottomRight.clickType;
    }

    // Create tensors
    if (modelName === "efficient-sam") {
      pointCoordsTensor = new Tensor("float32", pointCoords, [
        1,
        1,
        clickLength + padding,
        2,
      ]);
      pointLabelsTensor = new Tensor("float32", pointLabels, [
        1,
        1,
        clickLength + padding,
      ]);
    } else {
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
  }

  const imageSizeTensor = new Tensor("int64", [
    modelScale.width,
    modelScale.height,
  ]);

  if (pointCoordsTensor === undefined || pointLabelsTensor === undefined)
    return;

  const maskInput = new Tensor(
    "float32",
    new Float32Array(256 * 256),
    [1, 1, 256, 256]
  );
  const hasMaskInput = new Tensor("float32", [0]);

  return {
    image_embeddings: tensor,
    batched_point_coords: pointCoordsTensor,
    batched_point_labels: pointLabelsTensor,
    orig_im_size: imageSizeTensor,
  };
};

export { modelData };
