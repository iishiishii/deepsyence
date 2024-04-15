/* eslint-disable */
import * as ort from "onnxruntime-web";
import { BaseImageModel } from "./base";
import { boundingBox, modelInputProps } from "../helpers/Interfaces";
import { modelData } from "../helpers/onnxModelAPI";
import { maskImage } from "../helpers/imageHelpers";

export type SAMResult = {
  elapsed: number;
  embedding: ort.Tensor[] | undefined;
};

export class SegmentAnythingModel extends BaseImageModel {
  private lastProcessedVolume: any;
  encoderResult: ort.Tensor[] | undefined = [];

  process = async (
    volume: any,
    sliceId: number
  ): Promise<SAMResult | undefined> => {
    const start = new Date();
    // let embedding: Float32Array | undefined;
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      throw Error("the model is not initialized");
    }
    if (volume !== undefined) {
      console.log("input ", volume);
      if (this.lastProcessedVolume !== volume) {
        this.preprocessor.processVolume(volume);
        this.lastProcessedVolume = volume;
        for (let i = 90; i < 91; i++) {
          this.encoderResult?.concat(new ort.Tensor("float32", [], [0]));
        }
      }
      await this.processEncoder(sliceId);
    } else {
      console.log("didnt run encoder ", volume);
    }

    if (this.encoderResult === undefined && volume === undefined) {
      throw Error("you must provide an image as an input");
    }
    if (volume === undefined) {
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

  processEncoder = async (sliceId: number) => {
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      throw Error("the model is not initialized");
    }
    const start = new Date();
    const result = this.preprocessor.process(sliceId);

    const session = this.sessions.get("encoder");
    if (!session) {
      throw Error("the encoder is absent in the sessions map");
    }
    console.log("session ", session);

    const feeds: Record<string, ort.Tensor> = {};
    feeds["batched_images"] = result.tensor;
    console.log("feeds ", feeds);
    try {
      const outputData = await session.run(feeds);
      const outputNames = await session.outputNames();
      const output = outputData[outputNames[0]];
      this.encoderResult![sliceId] = output;
      const end = new Date();
      const inferenceTime = end.getTime() - start.getTime();
      console.log("inference time ", inferenceTime);

      // const output = results[session.outputNames[0]].data;
      console.log("output ", this.encoderResult);
      console.log(
        "output sum ",
        (output.data as Float32Array).reduce((a: number, b: number) => a + b, 0)
      );
      // return output;
    } catch (e) {
      console.log(`failed to inference ONNX model: ${e}. `);
    }
  };

  processDecoder = async (
    image: any,
    sliceId: number,
    // tensor: ort.Tensor | undefined,
    clicks: modelInputProps[],
    bbox: boundingBox
    // mask: Uint8Array,
    // onModel: (id: any, name: any, array: any) => void,
  ): Promise<Uint8Array | undefined> => {
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      console.log("the model is not initialized");
      throw Error("the model is not initialized");
    }
    if (this.encoderResult === undefined) {
      throw Error("you must provide an image as an input");
    }
    const start = new Date();

    const LONG_SIDE_LENGTH = 1024;
    let w = image.dimsRAS[2];
    let h = image.dimsRAS[1];
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
    const tensor = this.encoderResult[sliceId];
    // prepare feeds. use model input names as keys
    const feeds = modelData({
      clicks,
      bbox,
      tensor,
      modelScale,
    });
    console.log("feeds ", feeds, modelScale);
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
      // const output = results["output_masks"].data.slice(
      //   maxIou * h * w,
      //   (maxIou + 1) * h * w,
      // );
      // await cv.loadOpenCV();
      let output =
        // inverseTransposeChannelDim(
        results["output_masks"].data as Float32Array;
      //   3,
      // );

      // const src = cv.matFromArray(w, h, cv.CV_32F, output as Float32Array);
      // let dst = new cv.Mat(w, h, cv.CV_32FC3);
      console.log(
        "decoder output",
        results["output_masks"],
        (output as Float32Array).reduce((a, b) => a + b, 0)
      );
      // console.log("output ", maxIou, (output as Float32Array).reduce((a, b) => a + b, 0));
      // let rotated = output.reverse();
      const rasImage = maskImage(
        output as Float32Array,
        w,
        h,
        clicks[0].z,
        mask
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
