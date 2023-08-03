// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

// Convert the onnx model mask prediction to ImageData
function arrayToImageData(input: any, width: number, height: number) {
  // const [r, g, b, a] = [0, 114, 189, 255]; // the masks's blue color
  let arr = Array(width*height*58).fill(0);
  // let arr = []
  for (let i = 0; i < input.length; i++) {

    // Threshold the onnx model mask prediction at 0.0
    // This is equivalent to thresholding the mask using predictor.model.mask_threshold
    // in python
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
  // for (let i = 0; i < height; i++) {
  //   for (let j = 0; j < width; j++) {
  //     // let idxWidth = i * width + j;
  //     // let idxHeight = j * height + i;
  //     arr[j + i * width ] = input[i + j * height];
  //   }
  // }
      // arr.push(...input)
  // let arr = rotateColMajor(input, width, height)
  // Rotate 90 degrees counter-clockwise
  // const rotatedArray = rotateCounterClockwise(input, width, height);
  
  // Flatten the rotated 2D image back to column-major array
  arr.push(...rotateCounterClockwise(input, height, width));
  // for (let r = 0; r < height; r++) { // flip 180 degree
  //   for (let c = width - 1; c >= 0; c--) {
  //     arr.push(input[r * width + c]);
  //   }
  // }

  // console.log("orig index, transposed index ", input[160], arr[0])
  // arr.push(...input)
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

function rotateImage180CW(arr: any, width: number, height: number) {
  const rotatedArray = [];
  
  for (let col = width - 1; col >= 0; col--) {
    for (let row = 0; row < height; row++) {
      rotatedArray.push(arr[(col * height) + row]);
    }
  }
  
  return rotatedArray;
}

function flipVertical(arr: any, rows: number, cols: number) {
  let result: any = [];
  for (let r = rows - 1; r >= 0; r--) {
    for (let c = 0; c < cols; c++) {
      result.push(arr[c * rows + r]);
    }
  }
  return result;
}

function rotate(arr: any, rows: number, cols: number) {
  let result: any = [];
  for (let c = 0; c < cols; c++) {
    for (let r = rows - 1; r >= 0; r--) {
      result.push(arr[r * cols + c]);
    }
  }
  return result;
}

function rotateCounterClockwise(arr: any, width: number, height: number) {
  const rotatedArray: any = [];

  for (let col = 0; col < width; col++) {
    for (let row = height - 1; row >= 0; row--) {
      rotatedArray.push(arr[row * width + col]);
    }
  }

  return rotatedArray;
}

function flattenImage(arr: any, width: number, height: number) {
  const flattenedArray: any = [];
  for (let col = 0; col < width; col++) {
    for (let row = 0; row < height; row++) {
      flattenedArray.push(arr[row * width + col]);
    }
  }
  return flattenedArray;
}

function rotateColMajor(arr: any, rows: number, cols: number) {
  let result: any = [];
  for (let c = cols - 1; c >= 0; c--) {
    for (let r = 0; r < rows; r++) {
      result.push(arr[r * cols + c]);
    }
  }
  return result;
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
