import { cv } from "opencv-web";
import { addChannel, stackSliceToRGB } from "@/helpers/utils/channelHandlers";
import { arrayToMat } from "@/helpers/utils/imageConversion";
import { downloadImage } from "@/helpers/utils/imageConversion";
import { TypedVoxelArray } from "@/helpers/utils/imageConversion";

export function getMax(
  arr: TypedVoxelArray
) {
  let len = arr.length;
  let max = -Infinity;

  while (len--) {
    max = arr[len] > max ? arr[len] : max;
  }
  return max;
}

export function getMin(
  arr: TypedVoxelArray
) {
  console.log("getMin arr", arr);
  let len = arr.length;
  let min = Infinity;

  while (len--) {
    min = arr[len] < min ? arr[len] : min;
  }
  return min;
}

export function normalizeArray(
  array: TypedVoxelArray,
  max: number,
  min: number = 0
): Float32Array {
  let normalizedArray = new Float32Array(array.length);
  for (let i = 0; i < array.length; i++) {
    normalizedArray[i] = (array[i] - min) / (max - min);
  }
  return normalizedArray;
}

export function standardizeArray(
  array: TypedVoxelArray,
  mean: number,
  std: number
): Float32Array {
  let standardizedArray = new Float32Array(array.length);
  for (let i = 0; i < array.length; i++) {
    standardizedArray[i] = (array[i] - mean) / std;
  }
  return standardizedArray;
}

export function resize(image: any, target: number | number[]) {
  let dstResized = new cv.Mat();
  let image4Channels;
  let oldw = image.size().width;
  let oldh = image.size().height;
  let neww, newh;
  // console.log("resize ", target, oldw, oldh);
  if (Array.isArray(target)) {
    neww = target[0];
    newh = target[1];
  } else {
    let scale = (target * 1.0) / Math.max(oldh, oldw);
    newh = oldh * scale;
    neww = oldw * scale;
  }
  // console.log("neww, newh ", neww, newh);
  if (image.type() !== cv.CV_8UC4) {
    image4Channels = addChannel(image.data);
  }
  let src = cv.matFromArray(oldw, oldh, cv.CV_8UC4, image4Channels);

  cv.resize(src, dstResized, new cv.Size(newh, neww), 0, 0, cv.INTER_CUBIC);
  // console.log("dstResized ", dstResized.size(), dstResized.type());

  return dstResized;
}

export function resizeTypedArray(image: any, target: number | number[]) {
  let dstResized = new cv.Mat();
  // let threshold = new cv.Mat();
  // let image4Channels;
  let oldw = image.size().width;
  let oldh = image.size().height;
  let neww, newh;
  // console.log("resize ", target, oldw, oldh);
  if (Array.isArray(target)) {
    neww = target[0];
    newh = target[1];
  } else {
    let scale = (target * 1.0) / Math.max(oldh, oldw);
    newh = oldh * scale;
    neww = oldw * scale;
  }
  console.log("neww, newh ", neww, newh);
  // if (image.type() !== cv.CV_32FC4) {
  //   image4Channels = addChannel(image.data);
  // }
  let src = cv.matFromArray(oldw, oldh, cv.CV_8UC1, image.data);

  try {
    cv.resize(src, dstResized, new cv.Size(neww, newh), 0, 0, cv.INTER_LINEAR);
    // console.log(
    //   "dstResized.data",
    //   dstResized.data,
    //   getMin(dstResized.data),
    //   getMax(dstResized.data)
    // );
    // cv.threshold(dstResized, dstResized, 1, 1, cv.THRESH_BINARY);
    // console.log("threshold dstResized.data", dstResized.data);
    // dstResized.convertTo(dstResized, cv.CV_8UC1);
    // console.log("resizedImage. 8uc1", dstResized.data);
  } catch (error) {
    console.log("error", error);
  }
  console.log("dstResized ", dstResized.size(), dstResized.type());

  return dstResized;
}

export function pad(image: any, target_size: number) {
  let dstPadded = new cv.Mat();
  let image4Channels;
  let h = image.size().height;
  let w = image.size().width;
  let padh = target_size - h;
  let padw = target_size - w;
  console.log("padh, padw ", padh, padw);
  if (image.type() !== cv.CV_8UC4) {
    image4Channels = addChannel(image.data);
  }
  // const value: Scalar = new cv.Scalar(0, 0, 0, 0);
  //  copyMakeBorder( src, dst, top, bottom, left, right, borderType, value );
  cv.copyMakeBorder(
    image,
    dstPadded,
    0,
    padh,
    0,
    padw,
    cv.BORDER_CONSTANT,
    new cv.Scalar(0, 0, 0, 0)
  );

  return dstPadded;
}

function interpolateSlices(
  slice1: typeof cv.Mat,
  slice2: typeof cv.Mat,
  alpha: number
): typeof cv.Mat {
  let result = new cv.Mat();
  cv.addWeighted(slice1, 1 - alpha, slice2, alpha, 0, result);
  return result;
}

export function resizeVolume(
  niiVolume: TypedVoxelArray,
  srcDim: number[],
  destDim: number[]
): Float32Array {
  const resizeVolume = new Float32Array(
    destDim[0] * destDim[1] * destDim[2]
  ).fill(0);

  let oldDepth = srcDim[2];
  let newDepth = destDim[2];
  let zScale = oldDepth / newDepth;

  for (let i = 100; i < 102; i++) {
    let zLow = Math.floor(i * zScale);
    let zHigh = Math.ceil(i * zScale);
    let slice;

    if (zLow === zHigh || zHigh >= oldDepth) {
      slice = niiVolume.slice(
        srcDim[0] * srcDim[1] * zLow,
        srcDim[0] * srcDim[1] * (zLow + 1)
      );
    } else {
      // Interpolate between two slices
      let sliceLow = niiVolume.slice(
        srcDim[0] * srcDim[1] * zLow,
        srcDim[0] * srcDim[1] * (zLow + 1)
      );
      let sliceLowMat = cv.matFromArray(
        srcDim[0],
        srcDim[1],
        cv.CV_8UC1,
        sliceLow
      );
      let sliceHigh = niiVolume.slice(
        srcDim[0] * srcDim[1] * zHigh,
        srcDim[0] * srcDim[1] * (zHigh + 1)
      );
      let sliceHighMat = cv.matFromArray(
        srcDim[0],
        srcDim[1],
        cv.CV_8UC1,
        sliceHigh
      );
      let alpha = zScale * i - zLow;
      // console.log("alpha", alpha);
      slice = interpolateSlices(sliceLowMat, sliceHighMat, alpha);
    }
    console.log("slice", slice);

    let stackMask = stackSliceToRGB(slice.data);
    console.log("stackImage", stackMask, destDim[0], destDim[1]);
    let save = downloadImage(stackMask, srcDim[0], srcDim[1]);

    let resizedSlice = resizeTypedArray(slice, destDim);
    let stackImage = stackSliceToRGB(resizedSlice.data);
    console.log("stackImage", stackImage, destDim[0], destDim[1]);
    let saved = downloadImage(stackImage, destDim[0], destDim[1]);

    for (let j = 0; j < destDim[0] * destDim[1]; j++) {
      resizeVolume[i * destDim[0] * destDim[1] + j] = resizedSlice.data[j];
    }
    // resizedSlice.delete();
  }

  // if (srcDim[2] < destDim[2]) {
  //   const padding = Math.floor((destDim[2] - srcDim[2]) / 2);
  //   // console.log("i range", padding, srcDim[0], srcDim[0] + padding, resizeVolume.length);

  //   // Resize and place the image in the middle
  //   for (let i = 0; i < srcDim[2]; i++) {
  //     // for (let i = 90; i < 91; i++) {
  //     let src = niiVolume.slice(
  //       srcDim[0] * srcDim[1] * i,
  //       srcDim[0] * srcDim[1] * (i + 1)
  //     );
  //     // let dst = cv.matFromArray(srcDim[0], srcDim[1], cv.CV_32FC1, src);
  //     // console.log("dst.data", dst.data, srcDim[0], srcDim[1]);
  //     let image3Channels = stackSliceToRGB(src);
  //     let mat = arrayToMat(image3Channels, [srcDim[0], srcDim[1]]);
  //     let resizedImage = resize(mat, destDim.slice(0, 2));
  //     // let save = downloadImage(filterChannels(resizedImage.data, 3), 256, 256);
  //     // console.log("dstResized.data", resizedImage.data);
  //     let filteredImage = filterChannels(resizedImage.data, 1);

  //     // console.log(
  //     //   "filteredImage",
  //     //   filteredImage,
  //     //   filteredImage.reduce((a, b) => a + b, 0)
  //     // );
  //     // let saved = downloadImage(stackSliceToRGB(filteredImage), 256, 256);
  //     for (let j = 0; j < destDim[0] * destDim[1]; j++) {
  //       resizeVolume[(i + padding) * destDim[1] * destDim[1] + j] =
  //         filteredImage[j];
  //     }
  //   }
  // } else {
  //   const cropping = Math.floor((srcDim[2] - destDim[2]) / 2);
  //   for (let i = cropping; i < destDim[2] - cropping; i++) {
  //     // for (let i = 100; i < 101; i++) {
  //     let src = niiVolume.slice(
  //       srcDim[0] * srcDim[1] * i,
  //       srcDim[0] * srcDim[1] * (i + 1)
  //     );

  //     let srcMat = cv.matFromArray(srcDim[0], srcDim[1], cv.CV_8UC1, src);

  //     let resizedImage = resizeTypedArray(srcMat, destDim);
  //     console.log(
  //       "dstResized.data",
  //       resizedImage.data,
  //       getMin(resizedImage.data),
  //       getMax(resizedImage.data)
  //     );
  //     let stackImage = stackSliceToRGB(resizedImage.data);
  //     console.log("stackImage", stackImage, destDim[0], destDim[1]);
  //     // let saved = downloadImage(stackImage, destDim[0], destDim[1]);

  //     for (let j = 0; j < destDim[0] * destDim[1]; j++) {
  //       resizeVolume[i * destDim[0] * destDim[1] + j] = resizedImage.data[j];
  //     }
  //   }
  // }

  return resizeVolume;
}

export function padVolume(
  niiVolume: TypedVoxelArray,
  srcDim: number[],
  destDim: number[]
): Float32Array {
  const padVolume = new Float32Array(destDim[0] * destDim[1] * destDim[2]).fill(
    0
  );

  for (let i = 0; i < srcDim[2]; i++) {
    for (let j = 0; j < srcDim[1]; j++) {
      for (let k = 0; k < srcDim[0]; k++) {
        padVolume[i * destDim[0] * destDim[1] + j * destDim[0] + k] =
          niiVolume[i * srcDim[0] * srcDim[1] + j * srcDim[0] + k];
      }
    }

    // let stackImage = stackSliceToRGB(
    //   padVolume.slice(
    //     i * destDim[0] * destDim[1],
    //     (i + 1) * destDim[0] * destDim[1]
    //   )
    // );
    // let stackImage = stackSliceToRGB(src);
    // console.log(
    //   "padVolume",
    //   destDim[0],
    //   destDim[1],
    //   padVolume.slice(
    //     i * destDim[0] * destDim[1],
    //     (i + 1) * destDim[0] * destDim[1]
    //   )
    // );
    // let saved = downloadImage(stackImage, destDim[0], destDim[1]);
  }
  return padVolume;
}
