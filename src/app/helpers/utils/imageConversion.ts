import Jimp from "jimp";
import { Tensor } from "onnxruntime-web";
import { cv } from "opencv-web";
import { addChannel } from "./channelHandlers";

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
  console.log(dst.data.slice(600, 610));
  console.log(dst);
  new Jimp({
    width: dims[0],
    height: dims[1],
    data: Buffer.from(dst.data),
  }).write("./niivue.png");
}

export function imageDataToTensor(data, dims): any {
  // 1a. Extract the R, G, and B channels from the data to form a 3D int array
  const [R, G, B]: number[][] = [[], [], []];
  for (let i = 0; i < data.length; i += 3) {
    R.push(data[i]);
    G.push(data[i + 1]);
    B.push(data[i + 2]);
    // 2. skip data[i + 3] thus filtering out the alpha channel
  }
  // 1b. concatenate RGB ~= transpose [224, 224, 3] -> [3, 224, 224]
  const transposedData = R.concat(G).concat(B);

  // 3. convert to float32
  let i,
    l = transposedData.length; // length, we need this for the loop
  const float32Data = new Float32Array(dims[3] * dims[1] * dims[2]); // create the Float32Array for output
  for (i = 0; i < l; i++) {
    float32Data[i] = transposedData[i]; // divide by max value to convert to float
  }

  const inputTensor = new Tensor("float32", float32Data, dims);
  return inputTensor;
}

export const downloadToFile = (
  content: Float32Array | Uint8Array,
  filename: string,
  contentType: string = "text/plain"
) => {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });

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
