// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import { Tensor } from "onnxruntime-web";
import * as Jimp from 'jimp';

// Helper function for handling image scaling needed for SAM
const handleImageScale = (image: HTMLImageElement) => {
  // Input images to SAM must be resized so the longest side is 1024
  const LONG_SIDE_LENGTH = 1024;
  let w = image.naturalWidth;
  let h = image.naturalHeight;
  const samScale = LONG_SIDE_LENGTH / Math.max(h, w);
  return { height: h, width: w, samScale };
};

// resize image for SAM
function bilinearInterpolation(src: any, dst: any) {
  function interpolate(
    k: number,
    kMin: number,
    kMax: number,
    vMin: number,
    vMax: number,
  ) {
    return Math.round((k - kMin) * vMax + (kMax - k) * vMin);
  }

  function interpolateHorizontal(
    offset: number,
    x: number,
    y: number,
    xMin: number,
    xMax: number,
  ) {
    const vMin = src.data[((y * src.width + xMin) * 3) + offset];
    if (xMin === xMax) return vMin;

    const vMax = src.data[((y * src.width + xMax) * 3) + offset]
    return interpolate(x, xMin, xMax, vMin, vMax);
  }

  function interpolateVertical(
    offset: number,
    x: number,
    xMin: number,
    xMax: number,
    y: number,
    yMin: number,
    yMax: number,
  ) {
    const vMin = interpolateHorizontal(offset, x, yMin, xMin, xMax);
    if (yMin === yMax) return vMin;

    const vMax = interpolateHorizontal(offset, x, yMax, xMin, xMax);
    return interpolate(y, yMin, yMax, vMin, vMax);
  }

  let pos = 0;

  for (let y = 0; y < dst.height; y++) {
    for (let x = 0; x < dst.width; x++) {
      const srcX = (x * src.width) / dst.width;
      const srcY = (y * src.height) / dst.height;

      const xMin = Math.floor(srcX);
      const yMin = Math.floor(srcY);

      const xMax = Math.min(Math.ceil(srcX), src.width - 1);
      const yMax = Math.min(Math.ceil(srcY), src.height - 1);

      dst.data[pos++] = interpolateVertical(0, srcX, xMin, xMax, srcY, yMin, yMax); // R
      dst.data[pos++] = interpolateVertical(1, srcX, xMin, xMax, srcY, yMin, yMax) // G
      dst.data[pos++] = interpolateVertical(2, srcX, xMin, xMax, srcY, yMin, yMax) // B
      // dst.data[pos++] = interpolateVertical(3, srcX, xMin, xMax, srcY, yMin, yMax) // A
    }
  }
}

function nearestNeighbor (src: any, dst: any) {
  let pos = 0

  for (let y = 0; y < dst.height; y++) {
    for (let x = 0; x < dst.width; x++) {
      const srcX = Math.floor(x * src.width / dst.width)
      const srcY = Math.floor(y * src.height / dst.height)

      let srcPos = ((srcY * src.width) + srcX) * 3

      dst.data[pos++] = src.data[srcPos++] // R
      dst.data[pos++] = src.data[srcPos++] // G
      dst.data[pos++] = src.data[srcPos++] // B
      // dst.data[pos++] = src.data[srcPos++] // A
    }
  }
}

const resizeImageData = (
  image: { data: Float32Array; height: number; width: number },
  width: number,
  height: number,
) => {
  const resultArray = new Float32Array(width * height * 3);

  const result = {
    data: resultArray,
    width: width,
    height: height,
  };

  bilinearInterpolation(image, result);
  // nearestNeighbor(image, result);

  return result;
};

export function pad(image: { data: Float32Array; height: number; width: number }, padSize: number, center: boolean = false): Float32Array {
  // Get dimensions of the original image
  const width = image.width;
  const height = image.height;
  // Create a new blank image with the padded dimensions
  const paddedImage = new (Jimp as any)(padSize, padSize, 0xFFFFFFFF)
  if (center) {
    const startX = (padSize - width) / 2;
    const startY = (padSize - height) / 2;  
    paddedImage.composite(image, startX, startY);
  } else {
    paddedImage.composite(image, 0, 0);
  };

  // Place the original image into the padded image
  return paddedImage;
};

export function padToSquare(image: { data: Float32Array; height: number; width: number }): Float32Array {
  const padSize = Math.max(image.width, image.height);
  const paddedimage = pad(image, padSize);
  return paddedimage;
};

// def preprocess(x: torch.Tensor) -> torch.Tensor:
//     """Normalize pixel values and pad to a square input."""
//     # Normalize colors
//     pixel_mean = torch.Tensor([123.675, 116.28, 103.53]).view(-1, 1, 1)
//     pixel_std = torch.Tensor([58.395, 57.12, 57.375]).view(-1, 1, 1)
//     x = (x - pixel_mean) / pixel_std

//     print(pixel_mean, pixel_mean.shape, pixel_std.shape, x.shape)
//     # Pad
//     h, w = x.shape[-2:]
//     padh = 1024 - h
//     padw = 1024 - w
//     x = F.pad(x, (0, padw, 0, padh))
//     return x
const normalize = (image: Float32Array): Float32Array => {
  let mean = new Float32Array([123.675, 116.28, 103.53])
  let std = new Float32Array([58.395, 57.12, 57.375])

  // 1. Get buffer data from image and create R, G, and B arrays.
  let imageBufferData = image;
  // const [redArray, greenArray, blueArray] = new Array(new Array<number>(), new Array<number>(), new Array<number>());
  
  // // 2. Loop through the image buffer and extract the R, G, and B channels
  const float32Data = new Float32Array(imageBufferData.length);
  for (let i = 0; i < imageBufferData.length; i += 3) {
    float32Data[3*i] = (imageBufferData[i] / 255 - mean[0]) / std[0];
    float32Data[3*i +1] = (imageBufferData[i + 1] / 255 - mean[1]) / std[1];
    float32Data[3*i + 2] = (imageBufferData[i + 2] / 255 - mean[2]) / std[2];
  }
  return float32Data;
};


// const preprocessImage = (
//   image: Tensor
// ) => {
//   let pixel_mean: Tensor = new Tensor(
//     "float32",
//     new Float32Array([123.675, 116.28, 103.53]),
//     [3,1,1],
//   );
//   let pixel_std: Tensor = new Tensor(
//     "float32",
//     new Float32Array([58.395, 57.12, 57.375]),
//     [3,1,1],
//   );

//   normalizedImage = (image - pixel_mean) / pixel_std;
//   return result;
// }
export { handleImageScale, resizeImageData, normalize };
