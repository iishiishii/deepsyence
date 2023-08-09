// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

// Convert the onnx model mask prediction to ImageData
function arrayToImageData(input: any, width: number, height: number) {
  let arr = Array(width*height*58).fill(0);
  for (let i = 0; i < input.length; i++) {
    // Threshold the onnx model mask prediction at 0.0
    if (input[i] <= 0.0) {
      input[i] = 0;
    }
    else {
      input[i] = 1;
    }
  }
  console.log(
    `before transposed array: ${input.reduce(
      (partialSum: number, a: number) => partialSum + a,
      0,
    )}`,
  );

  // Flatten the rotated 2D image back to column-major array
  arr.push(...rotate(input, height, width));

  let transposedInput = new Float32Array(arr);
  console.log("transposedInput ", transposedInput, "height ", height, "width ", width)
  console.log(
    `sum of transposed array: ${transposedInput.reduce(
      (partialSum, a) => partialSum + a,
      0,
    )}`,
  );
  return transposedInput;
}

export function colToRow(image: any, colArray: any) {
  let dims = image.dimsRAS;
  // let colArray = image.img
  let rowArray = new Float32Array(dims[1] * dims[2] * dims[3]);
  console.log(dims);
  for (let i = 0; i < dims[1]; i++) {
    for (let j = 0; j < dims[2]; j++) {
      for (let k = 0; k < dims[3]; k++) {
        let indexCol = i + j * dims[1] + k * dims[1] * dims[2];
        let indexRow = i * dims[2] * dims[3] + j * dims[3] + k;
        rowArray[indexRow] = colArray[indexCol];
      }
    }
  }
  return rowArray;
}

export function rowToCol(image: any, rowArray: any) {
  let dims = image.dimsRAS;
  // let colArray = image.img
  let colArray = new Float32Array(dims[1] * dims[2] * dims[3]);
  console.log(dims);
  for (let i = 0; i < dims[1]; i++) {
    for (let j = 0; j < dims[2]; j++) {
      for (let k = 0; k < dims[3]; k++) {
        let indexCol = i + j * dims[1] + k * dims[1] * dims[2];
        let indexRow = i * dims[2] * dims[3] + j * dims[3] + k;
        colArray[indexCol] = rowArray[indexRow];
      }
    }
  }
  return colArray;
}

function rotate(arr: any, width: number, height: number) {
  const rotatedArray: any = [];

  for (let col = 0; col < width; col++) {
    for (let row = height - 1; row >= 0; row--) {
      rotatedArray.push(arr[row * width + col]);
    }
  }

  return rotatedArray;
}

// Convert the onnx model mask prediction to ImageData
function arrayToMaskData(input: any, width: number, height: number) {
  const [r, g, b, a] = [0, 114, 189, 255]; // the masks's blue color
  const arr = new Float32Array(4 * width * height).fill(0);
  for (let i = 0; i < input.length; i++) {

    // Threshold the onnx model mask prediction at 0.0
    // This is equivalent to thresholding the mask using predictor.model.mask_threshold
    // in python
    if (input[i] > 0.0) {
      arr[4 * i + 0] = r;
      arr[4 * i + 1] = g;
      arr[4 * i + 2] = b;
      arr[4 * i + 3] = a;
    }
  }
  console.log("arr ", arr, "height ", height, "width ", width)
  return arr;
}

// Use a Canvas element to produce an image from ImageData
function imageDataToImage(imageData: ImageData) {
  const canvas = imageDataToCanvas(imageData);
  const image = new Image();
  image.src = canvas.toDataURL();
  return image;
}

// Canvas elements can be created from ImageData
function imageDataToCanvas(imageData: ImageData) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx?.putImageData(imageData, 0, 0);
  return canvas;
}

// Convert the onnx model mask output to an HTMLImageElement
export function onnxMaskToImage(input: any, width: number, height: number) {
  return arrayToImageData(input, width, height);
}
