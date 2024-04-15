import { cv } from "opencv-wasm";
import { addChannel } from "./channelHandlers";

export function getMax(arr) {
  let len = arr.length;
  let max = -Infinity;

  while (len--) {
    max = arr[len] > max ? arr[len] : max;
  }
  return max;
}

export function getMin(arr) {
  let len = arr.length;
  let min = Infinity;

  while (len--) {
    min = arr[len] < min ? arr[len] : min;
  }
  return min;
}

export function normalizeArray(
  array: Float32Array | Uint8Array,
  max: number
): Float32Array {
  let normalizedArray = new Float32Array(array.length);
  for (let i = 0; i < array.length; i++) {
    normalizedArray[i] = array[i] / max;
  }
  return normalizedArray;
}

export function standardizeArray(
  array: Float32Array | Uint8Array,
  mean: number,
  std: number
): Float32Array {
  let standardizedArray = new Float32Array(array.length);
  for (let i = 0; i < array.length; i++) {
    standardizedArray[i] = (array[i] - mean) / std;
  }
  return standardizedArray;
}

export function resizeLongerSide(image: any, target_length: number) {
  let dstResized = new cv.Mat();
  let image4Channels;
  let oldw = image.size().width;
  let oldh = image.size().height;
  console.log("oldh, oldw ", oldh, oldw, image.size());
  let scale = (target_length * 1.0) / Math.max(oldh, oldw);
  let newh = oldh * scale;
  let neww = oldw * scale;
  console.log("target_size ", newh, neww, new cv.Size(newh, neww));
  if (image.type() !== cv.CV_8UC4) {
    image4Channels = addChannel(image.data);
  }
  let src = cv.matFromArray(oldw, oldh, cv.CV_8UC4, image4Channels);

  cv.resize(src, dstResized, new cv.Size(newh, neww), 0, 0, cv.INTER_CUBIC);
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
  //  copyMakeBorder( src, dst, top, bottom, left, right, borderType, value );
  cv.copyMakeBorder(image, dstPadded, 0, padh, 0, padw, cv.BORDER_CONSTANT);

  return dstPadded;
}
