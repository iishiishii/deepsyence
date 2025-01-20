/* eslint-disable */
import { BaseImageModel } from "./base";
import { maskVolume } from "../helpers/utils/maskHandlers";
import { Tensor } from "onnxruntime-web";
import { UnetResult } from "../helpers/Interfaces";


export class UnetModel extends BaseImageModel {
  private lastProcessedVolume: any;
  private processedVolume: Float32Array | undefined;
  outputMask: Uint8Array | undefined;
  samScale: number = 1;

  process = async (volume: any): Promise<Uint8Array | undefined> => {
    const start = new Date();

    // let embedding: Float32Array | undefined;
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      throw Error("the model is not initialized");
    }
    if (volume !== undefined) {
      console.log("input ", volume);
      if (this.lastProcessedVolume !== volume) {
        this.processedVolume = this.preprocessor.processVolume(volume);
        this.lastProcessedVolume = volume;
      }
      // console.log(
      //   "this.lastProcessedVolume min",
      //   getMin(this.processedVolume),
      //   "max",
      //   getMax(this.processedVolume)
      // );
      await this.runInference(volume);
    } else {
      console.log("didnt run encoder ", volume);
    }

    if (volume === undefined) {
      return undefined;
    }

    const end = new Date();
    const elapsed = (end.getTime() - start.getTime()) / 1000;
    const result: UnetResult = {
      mask: this.outputMask,
      elapsed: elapsed,
    };
    console.log("result ", result);
    return this.outputMask;
  };

  filterInPlace = (a: Float32Array) => {
    for (let i = 0; i < a.length; i++) {
      if (a[i] < 0) a[i] = 0;
      else a[i] = 255;
    }
    return a;
  };

  binaryThreshold = (a: Float32Array, threshold: number = 0): Uint8Array => {
    let binaryMask = new Uint8Array(a.length);
    for (let i = 0; i < a.length; i++) {
      if (a[i] <= threshold) binaryMask[i] = 0;
      else binaryMask[i] = 255;
    }
    return binaryMask;
  };

  /*
   * Filter the channels of the image to keep only one output label from last channel [1,256,256,256,3]
   * @param image: The image to filter
   * @param label: The dimension in label channel 0 - 2
   * @returns The filtered image
   * */
  filterChannels = (
    image: Float32Array | Uint8Array | Array<number>,
    label: number = 1
  ): Float32Array => {
    console.log("image ", image, "label ", label);
    const float32Data = new Float32Array(image.length / 3);
    for (let i = label; i < image.length; i += 3) {
      float32Data[Math.round(i / 3) + label] = image[i];
    }
    return float32Data;
  };

  cropVolume = (
    image: Float32Array,
    oldDims: number[],
    newDims: number[]
  ): Float32Array => {
    let cropped = new Float32Array(newDims[0] * newDims[1] * newDims[2]);
    for (let i = 0; i < newDims[2]; i++) {
      for (let j = 0; j < newDims[1]; j++) {
        for (let k = 0; k < newDims[0]; k++) {
          cropped[i * newDims[1] * newDims[0] + j * newDims[0] + k] =
            image[i * oldDims[1] * oldDims[0] + j * oldDims[0] + k];
        }
      }
    }
    return cropped;
  };

  // data could be both array or object
  softmax = (data: Float32Array, from = 0, to = data.length): Float32Array => {
    let max = -Infinity; // Math.max(...data) vould crash on large array
    for (let id = from; id < to; id++) {
      if (max < data[id]) {
        max = data[id];
      }
    }
    // No need to use reduce, just sum the exps in the loop
    let sumOfExp = 0;
    const result = new Float32Array(data.length);
    for (let id = from; id < to; id++) {
      result[id] = Math.exp(data[id] - max);
      sumOfExp += result[id];
    }
    // Finally divide by the sum of exps
    for (let id = from; id < to; id++) {
      result[id] = result[id] / sumOfExp;
    }

    return result;
  };

  runInference = async (image: any) => {
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      throw Error("the model is not initialized");
    }
    const start = new Date();
    let w = image.dimsRAS[1];
    let h = image.dimsRAS[2];
    let d = image.dimsRAS[3];

    const session = this.sessions.get("model");
    if (!session) {
      throw Error("the encoder is absent in the sessions map");
    }
    if (!this.processedVolume) {
      throw Error("the processed volume is not set");
    }
    const inputData = await session.inputNames();
    console.log("session ", session, [1, d, h, w, 1]);
    const feeds: Record<string, Tensor> = {};

    console.log("this.lastProcessedVolume", this.processedVolume);

    const inputTensor = new Tensor(
      "float32",
      this.processedVolume,
      [1, 256, 256, 256, 1]
    );

    console.log(
      "volume tensor ",
      inputTensor,
      inputTensor.data.reduce((a, b) => a + b, 0)
    );
    feeds[inputData[0]] = inputTensor;
    console.log("feeds ", feeds);
    if (!session) {
      console.log("the decoder is absent in the sessions map");
      throw Error("the decoder is absent in the sessions map");
    }
    const outputData = await session.outputNames();

    try {
      // feed inputs and run
      let results = await session.run(feeds);
      let mask = new Uint8Array(w * h * d);
      const end = new Date();
      const inferenceTime = end.getTime() - start.getTime();
      console.log("inference time ", inferenceTime);

      let output = results[outputData[0]].data as Float32Array;

      console.log(
        "output ",
        output,
        (output as Float32Array).reduce((a, b) => a + b, 0)
      );
      let binaryThreshold = new Uint8Array(w * h * d);
      // for (let i = 0; i < 3; i++) {
      let filterChannel = this.filterChannels(output, 0);
      console.log("filterChannel ", filterChannel);

      let cropped = this.cropVolume(filterChannel, [256, 256, 256], [w, h, d]);
      let softmax = this.softmax(cropped);
      console.log("softmax ", softmax);
      // let uintMask = stackSliceToRGB(
      //   filterChannel.slice(256 * 256 * 90, 256 * 256 * 91)
      // );
      binaryThreshold = this.binaryThreshold(softmax, 0);
      console.log("uintMask ", binaryThreshold);
      // let save = downloadImage(uintMask, 256, 256);
      // }
      this.outputMask = maskVolume(binaryThreshold, w, h, d, mask);
      console.log(
        "decoder output",
        this.outputMask.reduce((a, b) => a + b, 0)
      );
    } catch (e) {
      console.log(`failed to inference ONNX model: ${e}. `);
      throw Error(`failed to inference ONNX model: ${e}. `);
    }
  };
}
