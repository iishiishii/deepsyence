import * as ort from "onnxruntime-web";
import Jimp from "jimp";
import { BaseImageModel } from "./base";
import { boundingBox, modelInputProps } from "../helpers/Interfaces";
import { modelData } from "../helpers/onnxModelAPI";
import { maskImage } from "../helpers/imageHelpers";
import {
  convertArrayToImg,
  downloadToFile,
  imagedataToImage,
  normalize,
  normalizeArray,
  padToSquare,
  resize,
  resizeLonger,
  stackSliceToRGB,
  transposeChannelDim,
} from "../helpers/imageHelpers";
import * as nj from "numjs";


export type SAMResult = {
  elapsed: number;
  embedding: ort.Tensor[] | undefined;
};

export class SegmentAnythingModel extends BaseImageModel {
  encoderResult: ort.Tensor[] | undefined = [];
  // decoderResult: Uint8Array[] = new Uint8Array(width * height * sliceId).fill(0);


  preprocess = (image, sliceId) => {
    try {
      const MEAN = [51.38294238181054, 51.38294238181054, 51.38294238181054],
        STD = [64.6803075646777, 64.6803075646777, 64.6803075646777];
      const imageRAS = image.img2RAS();
      console.log("imageRAS ", imageRAS);
      const imageArray = imageRAS.slice(
        image.dims[1] * image.dims[2] * sliceId,
        image.dims[1] * image.dims[2] * (sliceId + 1),
      );
      console.log("imageArray ", imageArray);
      const normalizedArray = normalizeArray(imageArray, MEAN, STD);
      console.log("normalizedArray ", normalizedArray);
      const imageUint8 = nj.array(nj.uint8(normalizedArray));
      console.log("imageUint8 ", imageUint8);
      const resizedImage = nj.images.resize(imageUint8, 1024, 1024);
      console.log("resizedImage ", resizedImage);
      // const image3Channels = stackSliceToRGB(resizedImage);
      // const arrayToImage = convertArrayToImg(image3Channels, [
      //   image.dims[1],
      //   image.dims[2],
      // ]);
      // const arrayToImage = nj.array(image3Channels);
      // const paddedImage = padToSquare(
      //   normalizedArray,
      //   resizedImage.bitmap.width,
      //   resizedImage.bitmap.height,
      //   // [0, 0, 0],
      // );
      // console.log("image3Channels ", image3Channels);
      downloadToFile(resizedImage.tolist()[0], "/home/thuy/repo/deepsyence/resizedImage.jpg", "image/jpeg");
      // const transposedArray = transposeChannelDim(resizedImage.bitmap.data, 3);
      return resizedImage.tolist()[0];
    } catch (e) {
      console.log(`failed to inference ONNX model: ${e}. `);
      throw Error(`failed to inference ONNX model: ${e}. `);
    }
  };

  process = async (input: any, sliceId: number): Promise<SAMResult | undefined> => {
    const start = new Date();
    // let embedding: Float32Array | undefined;
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      throw Error("the model is not initialized");
    }
    if (input !== undefined) {
      console.log("input ", input);
      await this.processEncoder(input, sliceId);
    } else {
      console.log("didnt run encoder ", input);
    }

    if (this.encoderResult === undefined && input === undefined) {
      throw Error("you must provide an image as an input");
    }
    if (input === undefined) {
      return undefined;
    }

    const end = new Date();
    const elapsed = (end.getTime() - start.getTime()) / 1000;
    const result: SAMResult = {
      embedding: this.encoderResult,
      elapsed: elapsed,
    };
    console.log("result ", result);
    return result;
  };

  processEncoder = async (image: any, sliceId: number) => {
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      throw Error("the model is not initialized");
    }
    const start = new Date();
    const preprocessImage = this.preprocess(image, sliceId);
    const tensor = new ort.Tensor("float32", preprocessImage, [1, 3, 1024, 1024]);
    const session = this.sessions.get("encoder");
    if (!session) {
      throw Error("the encoder is absent in the sessions map");
    }
    console.log("session ", session);

    const feeds: Record<string, ort.Tensor> = {};
    feeds["x"] = tensor;
    // console.log("feeds ", feeds);
    try {
      const outputData = await session.run(feeds);
      const outputNames = await session.outputNames();
      const output = outputData[outputNames[0]];
      this.encoderResult = this.encoderResult!.concat(output);
      const end = new Date();
      const inferenceTime = end.getTime() - start.getTime();
      console.log("inference time ", inferenceTime);

      // const output = results[session.outputNames[0]].data;
      console.log("output ", this.encoderResult);
      // console.log("output sum ", output.reduce((a: number,b: number) => a+b,0))
      // return output;
    } catch (e) {
      console.log(`failed to inference ONNX model: ${e}. `);
    }
  };

  processDecoder = async (
    image: any,
    tensor: ort.Tensor | undefined,
    clicks: modelInputProps[],
    bbox: boundingBox,
    // mask: Uint8Array,
    // onModel: (id: any, name: any, array: any) => void,
  ): Promise<Uint8Array | undefined> => {
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      console.log("the model is not initialized");
      throw Error("the model is not initialized");
    }
    if (
      tensor === undefined
    ) {
      throw Error("you must provide an image as an input");
    }
    const start = new Date();
    let id = image.id;
    let name = image.name;

    const LONG_SIDE_LENGTH = 1024;
    let w = image.dimsRAS[1];
    let h = image.dimsRAS[2];
    const samScale = LONG_SIDE_LENGTH / Math.max(h, w);
    const modelScale = {
      samScale: samScale,
      height: h, // swap height and width to get row major order from npy arrayt to column order ?
      width: w,
    };
    const session = this.sessions.get("decoder");
    if (!session) {
      console.log("the decoder is absent in the sessions map");
      throw Error("the decoder is absent in the sessions map");
    }
    // prepare feeds. use model input names as keys
    const feeds = modelData({
      clicks,
      bbox,
      tensor,
      modelScale,
    });
    // console.log("feeds ", feeds, modelScale);
    if (feeds === undefined) return;

    try {
      // feed inputs and run
      let results = await session.run(feeds);
      let mask = new Uint8Array(w * h * image.dimsRAS[3]);
      const end = new Date();
      const inferenceTime = end.getTime() - start.getTime();
      console.log("inference time ", inferenceTime);
      // read from results
      // const output = results[session.outputNames[0]].data;
      const outputNames = await session.outputNames();
      const iou = results["iou_predictions"].data as Float32Array;

      // const maxIou = iou.indexOf(Math.max(...Array.from(iou)));
      const maxIou = 0;
      const output = results["masks"].data.slice(
        maxIou * h * w,
        (maxIou + 1) * h * w,
      );
      // console.log("output ", maxIou, (output as Float32Array).reduce((a, b) => a + b, 0));
      // let rotated = output.reverse();
      const rasImage = maskImage(
        output as Float32Array,
        w,
        h,
        clicks[0].z,
        mask,
      );
      // console.log("rasImage ", rasImage);
      // onModel(id, name, rasImage);
      return rasImage;
    } catch (e) {
      console.log(`failed to inference ONNX model: ${e}. `);
      throw Error(`failed to inference ONNX model: ${e}. `);
    }
  };
}
