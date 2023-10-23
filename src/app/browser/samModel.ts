import * as ort from "onnxruntime-common";
import Jimp from "jimp";
import { BaseImageModel } from "./base";
// import { SegmentationResult } from "./segmentationModel.js";

export interface Point {
  x: number;
  y: number;
  positive: boolean;
}

export type SAMResult = {
  elapsed: number;
  canvas: HTMLCanvasElement | OffscreenCanvas;
  topLeft: Point;
  bottomRight: Point;
};

export type SegmentAnythingPrompt = {
  image: string | ArrayBuffer | undefined;
  points: Point[] | undefined;
  boxes: Point[][] | undefined;
};

export class SegmentAnythingModel extends BaseImageModel {
  encoderResult: ort.Tensor | undefined;
  originalWidth: number | undefined;
  originalHeight: number | undefined;
  newWidth: number | undefined;
  newHeight: number | undefined;

  process = async (
    input: SegmentAnythingPrompt
  ): Promise<SAMResult | undefined> => {
    const start = new Date();
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      throw Error("the model is not initialized");
    }
    if (input.image !== undefined) {
      await this.processEncoder(input.image);
    }
    if (this.encoderResult === undefined && input.image === undefined) {
      throw Error("you must provide an image as an input");
    }
    if (input.boxes === undefined && input.points === undefined) {
      return undefined;
    }
    const decoderOutput = await this.processDecoder(input.points, input.boxes);
    const size = decoderOutput.dims[2] * decoderOutput.dims[3] * 4;
    const arrayBuffer = new ArrayBuffer(size);
    const pixels = new Uint8ClampedArray(arrayBuffer);
    const color = [237, 61, 26];
    const topLeft: Point = {
      x: Infinity,
      y: Infinity,
      positive: false,
    };
    const bottomRight: Point = {
      x: 0,
      y: 0,
      positive: false,
    };
    for (let y = 0; y < decoderOutput.dims[2]; y++) {
      for (let x = 0; x < decoderOutput.dims[3]; x++) {
        const value = decoderOutput.data[y * decoderOutput.dims[3] + x];
        if ((value as number) > 0) {
          const idx = (y * decoderOutput.dims[3] + x) * 4;
          pixels[idx] = color[0];
          pixels[idx + 1] = color[1];
          pixels[idx + 2] = color[2];
          pixels[idx + 3] = 255;
          if (x < topLeft.x) {
            topLeft.x = x;
          }
          if (y < topLeft.y) {
            topLeft.y = y;
          }
          if (x > bottomRight.x) {
            bottomRight.x = x;
          }
          if (y > bottomRight.y) {
            bottomRight.y = y;
          }
        } else {
          pixels[y] = 0;
          pixels[y + 1] = 0;
          pixels[y + 2] = 0;
          pixels[y + 3] = 0;
        }
      }
    }
    const imageData = new ImageData(
      pixels,
      decoderOutput.dims[3],
      decoderOutput.dims[2]
    );
    const resCanvas = this.createCanvas(imageData.width, imageData.height);
    const ctx = resCanvas.getContext("2d");
    if (
      ctx instanceof OffscreenCanvasRenderingContext2D ||
      ctx instanceof CanvasRenderingContext2D
    ) {
      ctx.putImageData(imageData, 0, 0);
    } else {
      throw new Error("Invalid rendering context");
    }
    const end = new Date();
    const elapsed = (end.getTime() - start.getTime()) / 1000;
    const result: SAMResult = {
      canvas: resCanvas,
      elapsed: elapsed,
      topLeft: topLeft,
      bottomRight: bottomRight,
    };
    return result;
  };

  processEncoder = async (input: string | ArrayBuffer) => {
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      throw Error("the model is not initialized");
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const image = await Jimp.read(input);
    this.originalWidth = image.bitmap.width;
    this.originalHeight = image.bitmap.height;
    const result = this.preprocessor.process(image);
    const session = this.sessions.get("encoder");
    if (!session) {
      throw Error("the encoder is absent in the sessions map");
    }
    const feeds: Record<string, ort.Tensor> = {};
    feeds["x"] = result.tensor;
    const outputData = await session.run(feeds);
    const outputNames = await session.outputNames();
    const output = outputData[outputNames[0]];
    this.encoderResult = output;
    this.newWidth = result.newWidth;
    this.newHeight = result.newHeight;
  };

  processDecoder = async (
    points: Point[] | undefined,
    boxes: Point[][] | undefined
  ): Promise<ort.Tensor> => {
    if (!this.initialized || !this.preprocessor || !this.sessions) {
      throw Error("the model is not initialized");
    }
    if (
      this.encoderResult === undefined ||
      this.originalWidth === undefined ||
      this.originalHeight === undefined ||
      this.newWidth === undefined ||
      this.newHeight === undefined
    ) {
      throw Error("you must provide an image as an input");
    }
    if (points === undefined && boxes === undefined) {
      throw Error("you must provide at least one point or box");
    }
    const onnx_coord: number[] = [];
    const onnx_label: number[] = [];
    if (points !== undefined) {
      for (const point of points) {
        onnx_coord.push((point.x / this.originalWidth) * this.newWidth);
        onnx_coord.push((point.y / this.originalHeight) * this.newHeight);
        onnx_label.push(point.positive ? 1 : 0);
      }
    }
    if (boxes !== undefined) {
      for (const box of boxes) {
        onnx_coord.push((box[0].x / this.originalWidth) * this.newWidth);
        onnx_coord.push((box[0].y / this.originalHeight) * this.newHeight);
        onnx_label.push(2);
        onnx_coord.push((box[1].x / this.originalWidth) * this.newWidth);
        onnx_coord.push((box[1].y / this.originalHeight) * this.newHeight);
        onnx_label.push(3);
      }
    } else {
      onnx_coord.push(0);
      onnx_coord.push(0);
      onnx_label.push(-1);
    }
    const session = this.sessions.get("decoder");
    if (!session) {
      throw Error("the decoder is absent in the sessions map");
    }
    const feeds: Record<string, ort.Tensor> = {};
    feeds["image_embeddings"] = this.encoderResult;
    feeds["mask_input"] = new ort.Tensor(
      new Float32Array(256 * 256).fill(1),
      [1, 1, 256, 256]
    );
    feeds["has_mask_input"] = new ort.Tensor(new Float32Array(1).fill(0), [1]);
    feeds["orig_im_size"] = new ort.Tensor(
      new Float32Array([this.originalHeight, this.originalWidth]),
      [2]
    );
    feeds["point_coords"] = new ort.Tensor(new Float32Array(onnx_coord), [
      1,
      onnx_coord.length / 2,
      2,
    ]);
    feeds["point_labels"] = new ort.Tensor(new Float32Array(onnx_label), [
      1,
      onnx_label.length,
    ]);
    const outputData = await session.run(feeds);
    return outputData["masks"];
  };

  createCanvas = (width: number, height: number) => {
    if (typeof OffscreenCanvas !== "undefined") {
      return new OffscreenCanvas(width, height);
    } else if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      return canvas;
    } else {
      throw new Error("Canvas creation is not supported in this environment");
    }
  };
}
