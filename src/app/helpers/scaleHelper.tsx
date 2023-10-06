// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

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

      let srcPos = ((srcY * src.width) + srcX) * 4

      dst.data[pos++] = src.data[srcPos++] // R
      dst.data[pos++] = src.data[srcPos++] // G
      dst.data[pos++] = src.data[srcPos++] // B
      dst.data[pos++] = src.data[srcPos++] // A
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

export { handleImageScale, resizeImageData };
