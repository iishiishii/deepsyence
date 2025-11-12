import { Jimp } from "jimp";
import { Tensor } from "onnxruntime-web";
import { cv } from "opencv-web";
import { addChannel } from "@/helpers/utils/channelHandlers";

export type TypedVoxelArray =
  | Float32Array
  | Uint8Array
  | Int16Array
  | Float64Array
  | Uint16Array;

export function convertArrayToTensor(
  float32image: Float32Array,
  dims: number[]
): Tensor {
  const inputTensor = new Tensor("float32", float32image, dims);
  return inputTensor;
}

export function arrayToMat(
  imagedata: Float32Array | Uint8Array,
  dims: number[]
) {
  let inputImage;
  if (dims[0] * dims[1] * 3 !== imagedata.length) {
    throw new Error("Image data size does not match the dimensions");
  }

  inputImage = new Uint8Array(dims[0] * dims[1] * 3);
  for (let i = 0; i < imagedata.length; i++) {
    inputImage[i] = imagedata[i] * 255;
  }

  let dst = cv.matFromArray(dims[0], dims[1], cv.CV_8UC3, inputImage);

  return dst;
}

export function imagedataToImage(
  imagedata: Float32Array | Uint8Array,
  dims: number[]
) {
  let inputImage;
  // if (dims[0]*dims[1] !== imagedata.length) {
  //     throw new Error("Image data size does not match the dimensions");
  // }

  inputImage = new Uint8Array(dims[0] * dims[1] * 3);
  for (let i = 0; i < imagedata.length; i++) {
    inputImage[i] = imagedata[i] * 255;
  }

  let dst = cv.matFromArray(dims[0], dims[1], cv.CV_8UC3, inputImage);
  // console.log(dst.data.slice(600, 610));
  // console.log(dst);
  new Jimp({
    width: dims[0],
    height: dims[1],
    data: Buffer.from(dst.data),
  }).write("./niivue.png");
}

export function imageDataToTensor(data: any, dims: number[]): any {
  // console.log(
  //   "data in imageDataToTensor",
  //   data.reduce((a: number, b: number) => a + b, 0),
  //   dims
  // );
  const [batch, channels, height, width] = dims;
  const pixelCount = height * width;

  if (data.length !== pixelCount * 3) {
    throw new Error(`Expected ${pixelCount * 3} values, got ${data.length}`);
  }
  // Pre-allocate output
  const float32Data = new Float32Array(pixelCount * 3);

  // Transpose in single pass: [H,W,C] -> [C,H,W]
  for (let i = 0; i < pixelCount; i++) {
    const srcIdx = i * 3;
    float32Data[i] = data[srcIdx]; // R channel
    float32Data[i + pixelCount] = data[srcIdx + 1]; // G channel
    float32Data[i + pixelCount * 2] = data[srcIdx + 2]; // B channel
  }

  // console.log(
  //   "float32Data sum:",
  //   float32Data.reduce((a, b) => a + b, 0),
  //   float32Data
  // );

  const inputTensor = new Tensor("float32", float32Data, dims);
  // console.log("inputTensor:", inputTensor);

  return inputTensor;
}

export const downloadToFile = (
  content: Float32Array | Uint8Array,
  filename: string,
  contentType: string = "application/octet-stream"
) => {
  const a = document.createElement("a");
  const file = new Blob([content as BlobPart], { type: contentType });

  a.href = URL.createObjectURL(file);
  a.download = filename;
  a.click();

  URL.revokeObjectURL(a.href);
};

export function downloadImage(
  imagedata: Float32Array | Uint8Array,
  width: number,
  height: number
) {
  let addedChannel = addChannel(imagedata);
  console.log("addedChannel", addedChannel);
  let imageUint8Clamped = new Uint8ClampedArray(addedChannel);
  let imageData = new ImageData(imageUint8Clamped, width, height);

  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  canvas.width = width | imageData.width;
  canvas.height = height | imageData.height;
  ctx!.putImageData(imageData, 0, 0);

  window.location.href = canvas
    .toDataURL("image/png")
    .replace("image/png", "image/octet-stream"); // here is the most important part because if you dont replace you will get a DOM 18 exception.
}
