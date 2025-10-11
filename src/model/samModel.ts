/* eslint-disable */
import * as ort from "onnxruntime-web";
import { BaseImageModel } from "@/model/base";
import { boundingBox, modelInputProps, SAMResult } from "@/helpers/Interfaces";
import { modelData } from "@/helpers/onnxModelAPI";
import { maskImage } from "@/helpers/utils/maskHandlers";
import { NVImage } from "@niivue/niivue";
export class SegmentAnythingModel extends BaseImageModel {
  private lastProcessedVolume: any;
  encoderResult: ort.Tensor[] = [];
  samScale: number = 1;

  process = async (
    volume: NVImage,
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
        // Initialize encoder results array with proper length
        this.encoderResult = new Array(volume.dimsRAS![3]);
        for (let i = 0; i < volume.dimsRAS![3]; i++) {
          // Initialize with empty tensor - will be replaced during processing
          const emptyData = new Float32Array([0]);
          this.encoderResult[i] = new ort.Tensor("float32", emptyData, [1]);
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
    const inputData = await session.inputNames();
    console.log("session ", session);
    const inputName = inputData[0];

    const feeds = {
      [inputName]: result.tensor,
    };
    // feeds[inputData[0]] = result.tensor;
    console.log("feeds ", feeds);
    this.samScale =
      result.newHeight /
      Math.max(this.preprocessor.dims[0], this.preprocessor.dims[1]);

    try {
      const outputData = await session.run(feeds);
      const outputNames = await session.outputNames();
      const output = outputData[outputNames[0]];
      this.encoderResult![sliceId] = output;
      const end = new Date();
      const inferenceTime = end.getTime() - start.getTime();
      console.log("inference time ", inferenceTime);

      console.log("output ", this.encoderResult);
      console.log(
        "output sum ",
        (output.data as Float32Array).reduce((a: number, b: number) => a + b, 0)
      );
    } catch (e) {
      console.log(`failed to inference ONNX model: ${e}. `);
    }
  };

  processDecoder = async (
    image: any,
    sliceId: number,
    clicks: modelInputProps[],
    bbox: boundingBox
  ): Promise<Uint8Array | undefined> => {
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      console.log("the model is not initialized");
      throw Error("the model is not initialized");
    }
    if (this.encoderResult === undefined) {
      throw Error("you must provide an image as an input");
    }
    const start = new Date();

    // const LONG_SIDE_LENGTH = 1024;
    let w = image.dimsRAS[2];
    let h = image.dimsRAS[1];
    const modelScale = {
      samScale: this.samScale,
      height: h, // swap height and width to get row major order from npy arrayt to column order ?
      width: w,
    };
    const session = this.sessions.get("decoder");
    if (!session) {
      console.log("the decoder is absent in the sessions map");
      throw Error("the decoder is absent in the sessions map");
    }
    const outputData = await session.outputNames();
    const modelName = this.metadata.id;
    const tensor = this.encoderResult[sliceId];

    // Check if tensor exists and has been processed
    if (!tensor || tensor.size === 1) {
      throw Error(
        `Encoder result for slice ${sliceId} is not available or not processed yet`
      );
    }
    // prepare feeds. use model input names as keys
    let feeds;
    if (this.metadata.id === "efficient-sam") {
      feeds = modelData({
        modelName,
        clicks,
        tensor,
        modelScale,
      });
    } else {
      feeds = modelData({
        modelName,
        clicks,
        bbox,
        tensor,
        modelScale,
      });
    }

    console.log("feeds ", feeds, modelScale, bbox);
    if (feeds === undefined) return;

    try {
      // feed inputs and run
      let results = await session.run(feeds);
      let mask = new Uint8Array(w * h * image.dimsRAS[3]);
      const end = new Date();
      const inferenceTime = end.getTime() - start.getTime();
      console.log("inference time ", inferenceTime);

      let output = results[outputData[0]].data as Float32Array;

      console.log(
        "decoder output",
        (output as Float32Array).reduce((a, b) => a + b, 0)
      );
      // console.log("output ", maxIou, (output as Float32Array).reduce((a, b) => a + b, 0));

      const rasImage = maskImage(
        output as Float32Array,
        w,
        h,
        clicks[0].z,
        mask
      );
      return rasImage;
    } catch (e) {
      console.log(`failed to inference ONNX model: ${e}. `);
      throw Error(`failed to inference ONNX model: ${e}. `);
    }
  };
}
