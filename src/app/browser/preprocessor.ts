import { PreprocessorConfig } from "./preprocessorConfig";
import * as ort from "onnxruntime-common";
import {
  getMax,
  getMin,
  normalizeArray,
  pad,
  resizeLongerSide,
  standardizeArray,
} from "../helpers/utils/imageProcessing";
import {
  filterAlphaChannel,
  stackSliceToRGB,
} from "../helpers/utils/channelHandlers";
import {
  arrayToMat,
  downloadImage,
  imageDataToTensor,
} from "../helpers/utils/imageConversion";

export interface PreprocessorResult {
  tensor: ort.Tensor;
  newWidth: number;
  newHeight: number;
}

export class Preprocessor {
  config: PreprocessorConfig;
  volume: any;
  dims: number[];
  maxVal: number;

  constructor(config: PreprocessorConfig) {
    this.config = config;
    this.dims = [0, 0, 0];
    this.maxVal = 0;
  }

  processVolume = (niiVolume: any) => {
    this.dims = [
      niiVolume.dimsRAS[1],
      niiVolume.dimsRAS[2],
      niiVolume.dimsRAS[3],
    ];
    this.maxVal = getMax(niiVolume.img2RAS());
    if (this.config.normalize) {
      this.volume = normalizeArray(niiVolume.img2RAS(), this.maxVal);
    } else {
      this.volume = niiVolume.img2RAS();
    }

    if (
      this.config.standardize.enabled &&
      this.config.standardize.mean &&
      this.config.standardize.std
    ) {
      this.volume = standardizeArray(
        this.volume,
        this.config.standardize.mean[0],
        this.config.standardize.std[0]
      );
    }
  };

  process = (sliceId: number): PreprocessorResult => {
    let inputTensor: ort.Tensor;

    let sliceArray = this.volume.slice(
      this.dims[0] * this.dims[1] * sliceId,
      this.dims[0] * this.dims[1] * (sliceId + 1)
    );
    let image3Channels = stackSliceToRGB(sliceArray);

    if (this.config.resize) {
      let mat = arrayToMat(image3Channels, [this.dims[0], this.dims[1]]);
      let resizedImage = resizeLongerSide(mat, this.config.size);
      console.log(
        "resizedImage",
        resizedImage.size().width,
        resizedImage.size().height,
        resizedImage.data.reduce((a, b) => a + b, 0)
      );
      if (this.config.pad) {
        let paddedImage = pad(resizedImage, this.config.padSize);
        console.log(
          "paddedImage",
          paddedImage.size().width,
          paddedImage.size().height,
          paddedImage.data.reduce((a, b) => a + b, 0)
        );
        let filteredImage = filterAlphaChannel(paddedImage.data);
        const maxVal = getMax(filteredImage);
        let normalizedImage = normalizeArray(filteredImage, maxVal);
        console.log(
          "normalizedImage",
          normalizedImage.reduce((a, b) => a + b, 0)
        );
        inputTensor = new ort.Tensor("float32", normalizedImage, [
          1,
          3,
          this.config.size,
          this.config.size,
        ]);
      } else {
        inputTensor = new ort.Tensor("float32", resizedImage.data, [
          1,
          3,
          this.config.size,
          this.config.size,
        ]);
      }
    } else {
      inputTensor = new ort.Tensor("float32", image3Channels, [
        1,
        3,
        this.dims[0],
        this.dims[1],
      ]);
    }
    let result: PreprocessorResult = {
      tensor: imageDataToTensor(inputTensor.data, [
        1,
        3,
        inputTensor.dims[3],
        inputTensor.dims[2],
      ]),
      newWidth: inputTensor.dims[2],
      newHeight: inputTensor.dims[3],
    };
    return result;
  };
}

export default Preprocessor;
