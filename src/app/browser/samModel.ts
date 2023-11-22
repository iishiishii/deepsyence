import * as ort from "onnxruntime-web";
import Jimp from "jimp";
import { BaseImageModel } from "./base";
import { boundingBox, modelInputProps } from "../helpers/Interfaces";
import { modelData } from "../helpers/onnxModelAPI";
import { maskImage } from "../helpers/imageHelpers";

export type SAMResult = {
  elapsed: number;
  embedding: ort.Tensor[] | undefined;
};

export class SegmentAnythingModel extends BaseImageModel {
  encoderResult: ort.Tensor[] | undefined = [];
  // decoderResult: Uint8Array[] = new Uint8Array(width * height * sliceId).fill(0);

  process = async (input: any): Promise<SAMResult | undefined> => {
    const start = new Date();
    let embedding: Float32Array | undefined;
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      throw Error("the model is not initialized");
    }
    if (input !== undefined) {
      console.log("input ", input);
      await this.processEncoder(input);
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
    return result;
  };

  processEncoder = async (image: any) => {
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      throw Error("the model is not initialized");
    }
    const start = new Date();
    // const result = this.preprocessor.process(image);
    const tensor = new ort.Tensor("float32", image, [1, 3, 1024, 1024]);
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
      // console.log("output ", this.encoderResult);
      // console.log("output sum ", output.reduce((a: number,b: number) => a+b,0))
      // return output;
    } catch (e) {
      console.log(`failed to inference ONNX model: ${e}. `);
    }
  };

  processDecoder = async (
    image: any,
    tensor: ort.TypedTensor<"string">,
    clicks: modelInputProps[],
    bbox: boundingBox,
    mask: Uint8Array,
    // onModel: (id: any, name: any, array: any) => void,
  ): Promise<Uint8Array | undefined> => {
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      console.log("the model is not initialized");
      throw Error("the model is not initialized");
    }

    const start = new Date();
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
    // console.log("feeds ", feeds);
    if (feeds === undefined) return;

    try {
      // feed inputs and run
      let results = await session.run(feeds);

      const end = new Date();
      const inferenceTime = end.getTime() - start.getTime();
      console.log("inference time ", inferenceTime);
      // read from results
      // const output = results[session.outputNames[0]].data;
      const outputNames = await session.outputNames();
      const iou = results["iou_predictions"].data as Float32Array;

      const maxIou = iou.indexOf(Math.max(...Array.from(iou)));
      const output = results["masks"].data.slice(
        maxIou * h * w,
        (maxIou + 1) * h * w,
      );
      // console.log("output ", maxIou, output);
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
