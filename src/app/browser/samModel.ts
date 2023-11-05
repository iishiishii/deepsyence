import * as ort from "onnxruntime-web";
import Jimp from "jimp";
import { BaseImageModel } from "./base";
import { modelInputProps } from "../helpers/Interfaces";
import { modelData } from "../helpers/onnxModelAPI";
import { maskImage } from "../helpers/imageHelpers";

export interface Point {
  x: number;
  y: number;
  positive: boolean;
}

export type SAMResult = {
  elapsed: number;
  embedding: ort.Tensor[] | undefined;
  // topLeft: Point;
  // bottomRight: Point;
};

export type SegmentAnythingPrompt = {
  image: string | ArrayBuffer | undefined;
  points: Point[] | undefined;
  boxes: Point[][] | undefined;
};

export class SegmentAnythingModel extends BaseImageModel {
  encoderResult: ort.Tensor[] | undefined = [];
  originalWidth: number | undefined;
  originalHeight: number | undefined;
  newWidth: number | undefined;
  newHeight: number | undefined;

  process = async (
    input: any
  ): Promise<SAMResult | undefined> => {
    const start = new Date();
    let embedding: Float32Array | undefined;
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      throw Error("the model is not initialized");
    }
    if (input !== undefined) {
      console.log("input ", input)
      await this.processEncoder(input);
    } else {
      console.log("didnt run encoder ", input)
    }

    if (this.encoderResult === undefined && input === undefined) {
      throw Error("you must provide an image as an input");
    }
    if (input === undefined) {
      return undefined;
    }
    // const decoderOutput = await this.processDecoder(input.points, input.boxes);
    // const size = decoderOutput.dims[2] * decoderOutput.dims[3] * 4;
    // const arrayBuffer = new ArrayBuffer(size);
    // const pixels = new Uint8ClampedArray(arrayBuffer);
    // const color = [237, 61, 26];
    // const topLeft: Point = {
    //   x: Infinity,
    //   y: Infinity,
    //   positive: false,
    // };
    // const bottomRight: Point = {
    //   x: 0,
    //   y: 0,
    //   positive: false,
    // };
    // for (let y = 0; y < decoderOutput.dims[2]; y++) {
    //   for (let x = 0; x < decoderOutput.dims[3]; x++) {
    //     const value = decoderOutput.data[y * decoderOutput.dims[3] + x];
    //     if ((value as number) > 0) {
    //       const idx = (y * decoderOutput.dims[3] + x) * 4;
    //       pixels[idx] = color[0];
    //       pixels[idx + 1] = color[1];
    //       pixels[idx + 2] = color[2];
    //       pixels[idx + 3] = 255;
    //       if (x < topLeft.x) {
    //         topLeft.x = x;
    //       }
    //       if (y < topLeft.y) {
    //         topLeft.y = y;
    //       }
    //       if (x > bottomRight.x) {
    //         bottomRight.x = x;
    //       }
    //       if (y > bottomRight.y) {
    //         bottomRight.y = y;
    //       }
    //     } else {
    //       pixels[y] = 0;
    //       pixels[y + 1] = 0;
    //       pixels[y + 2] = 0;
    //       pixels[y + 3] = 0;
    //     }
    //   }
    // }
    // const imageData = new ImageData(
    //   pixels,
    //   decoderOutput.dims[3],
    //   decoderOutput.dims[2]
    // );
    // const resCanvas = this.createCanvas(imageData.width, imageData.height);
    // const ctx = resCanvas.getContext("2d");
    // if (
    //   ctx instanceof OffscreenCanvasRenderingContext2D ||
    //   ctx instanceof CanvasRenderingContext2D
    // ) {
    //   ctx.putImageData(imageData, 0, 0);
    // } else {
    //   throw new Error("Invalid rendering context");
    // }
    const end = new Date();
    const elapsed = (end.getTime() - start.getTime()) / 1000;
    const result: SAMResult = {
      embedding: this.encoderResult,
      elapsed: elapsed,
    };
    return result;
  };

  processEncoder = async (image: any)  => {
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      throw Error("the model is not initialized");
    }
    const start = new Date();
    try {
      // const result = this.preprocessor.process(image);
      const tensor = new ort.Tensor("float32", image, [1, 3, 1024, 1024]);
      const session = this.sessions.get("encoder");
      if (!session) {
        throw Error("the encoder is absent in the sessions map");
      }
      console.log("session ", session)
    
      const feeds: Record<string, ort.Tensor> = {};
      feeds["x"] = tensor;
      console.log("feeds ", feeds)
      const outputData = await session.run(feeds);
      const outputNames = await session.outputNames();
      const output = outputData[outputNames[0]];
      this.encoderResult = this.encoderResult!.concat(output);
      const end = new Date();
      const inferenceTime = end.getTime() - start.getTime();
      console.log("inference time ", inferenceTime);
  
      // const output = results[session.outputNames[0]].data;
      console.log("output ", this.encoderResult)
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
    // onModel: (id: any, name: any, array: any) => void,
  ): Promise<Uint8Array | undefined> => {
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      throw Error("the model is not initialized");
    }

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
      const session = this.sessions.get("decoder");
      if (!session) {
        throw Error("the decoder is absent in the sessions map");
      }
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
      // const output = results[session.outputNames[0]].data;
      const outputNames = await session.outputNames();
      const iou = results['iou_predictions'].data as Float32Array;

      const maxIou = iou.indexOf(Math.max(...Array.from(iou)))
      const output = results['masks'].data.slice(maxIou*h*w, (maxIou+1)*h*w);
      console.log("output ", maxIou, output);
      // let rotated = output.reverse();
      const rasImage = maskImage(output as Float32Array, w, h, clicks[0].z);
      console.log("rasImage ", rasImage);
      // onModel(id, name, rasImage);
      return rasImage;
    } catch (e) {
      console.log(`failed to inference ONNX model: ${e}. `);
    }
  };
}
