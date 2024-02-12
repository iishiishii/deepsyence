import * as ort from "onnxruntime-web";
import { modelInputProps } from "./Interfaces";
import { modelData } from "./onnxModelAPI";
import { maskImage } from "./imageHelpers";
import {
  convertArrayToImg,
  imagedataToImage,
  normalize,
  padToSquare,
  resizeLonger,
  stackSliceToRGB,
  transposeChannelDim,
} from "./imageHelpers";

export const preprocess = (image, sliceId) => {
  const MEAN = [123.675, 116.28, 103.53],
    STD = [58.395, 57.12, 57.375];
  const imageRAS = image.img2RAS();
  const imageArray = imageRAS.slice(
    image.dims[1] * image.dims[2] * sliceId,
    image.dims[1] * image.dims[2] * (sliceId + 1),
  );

  const imageUint8 = new Uint8Array(imageArray);
  const image3Channels = stackSliceToRGB(imageUint8);
  const arrayToImage = convertArrayToImg(image3Channels, [
    image.dims[1],
    image.dims[2],
  ]);
  const resizedImage = resizeLonger(arrayToImage, 1024);
  const normalizedArray = normalize(resizedImage.bitmap.data, MEAN, STD);
  const paddedImage = padToSquare(
    normalizedArray,
    resizedImage.bitmap.width,
    resizedImage.bitmap.height,
    // [0, 0, 0],
  );

  const transposedArray = transposeChannelDim(paddedImage, 3);
  return transposedArray;
};

export const samDecoder = async (
  image: any,
  tensor: ort.TypedTensor<"string">,
  clicks: modelInputProps[],
  onModel: (id: any, name: any, array: any) => void,
) => {
  const start = new Date();
  try {
    let id = image.id;
    let name = image.name;

    const LONG_SIDE_LENGTH = 1024;
    let w = image.dims[1];
    let h = image.dims[2];
    const samScale = LONG_SIDE_LENGTH / Math.max(h, w);
    const modelScale = {
      samScale: samScale,
      height: h, // swap height and width to get row major order from npy arrayt to column order ?
      width: w,
    };

    ort.env.wasm.wasmPaths = new URL("./js/", document.baseURI).href;

    // @ts-ignore
    let modelUrl = new URL("./model/decoder-quant.onnx", document.baseURI).href;

    let session = await ort.InferenceSession.create(modelUrl, {
      executionProviders: ["wasm"],
    });

    // prepare feeds. use model input names as keys
    const feeds = modelData({
      clicks,
      tensor,
      modelScale,
    });
    console.log("feeds ", feeds);
    if (feeds === undefined) return;
    // feed inputs and run
    let results = await session.run(feeds);
    const end = new Date();
    const inferenceTime = end.getTime() - start.getTime();
    console.log("inference time ", inferenceTime);
    // read from results
    const output = results[session.outputNames[0]].data;

    // const rasImage = maskImage(output as Float32Array, w, h, clicks[0].z);
    // onModel(id, name, rasImage);
  } catch (e) {
    console.log(`failed to inference ONNX model: ${e}. `);
  }
};

export const samEncoder = async (image: any) => {
  const start = new Date();
  try {
    const tensor = new ort.Tensor("float32", image, [1, 3, 1024, 1024]);
    ort.env.wasm.wasmPaths = new URL("./js/", document.baseURI).href;
    ort.env.wasm.numThreads = 8; //https://github.com/microsoft/onnxruntime/issues/14220
    // @ts-ignore
    let modelUrl = new URL("./model/encoder-quant.onnx", document.baseURI).href;
    console.log("modelUrl ", modelUrl);
    let session = await ort.InferenceSession.create(modelUrl, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
      executionMode: "parallel",
    });
    console.log("session ", session);
    const feeds = {
      x: tensor,
    };
    console.log("feeds ", feeds);
    if (feeds === undefined) return;
    // feed inputs and run
    let results = await session.run(feeds);
    const end = new Date();
    const inferenceTime = end.getTime() - start.getTime();
    console.log("inference time ", inferenceTime);

    const output = results[session.outputNames[0]].data;

    return output;
  } catch (e) {
    console.log(`failed to inference ONNX model: ${e}. `);
  }
};