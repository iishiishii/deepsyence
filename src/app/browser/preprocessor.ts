import { PreprocessorConfig } from "./preprocessorConfig";
import * as ort from "onnxruntime-common";
import {
  getMax,
  getMin,
  normalizeArray,
  pad,
  padVolume,
  resize,
  standardizeArray,
} from "../helpers/utils/imageProcessing";
import {
  filterChannels,
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

  processVolume = (niiVolume: any): Float32Array => {
    this.dims = [
      niiVolume.dimsRAS[1],
      niiVolume.dimsRAS[2],
      niiVolume.dimsRAS[3],
    ];
    this.maxVal = getMax(niiVolume.img2RAS());
    console.log(
      "ori volume",
      getMin(niiVolume.img2RAS()),
      getMax(niiVolume.img2RAS()),
      niiVolume.img2RAS().reduce((a, b) => a + b, 0)
    );
    if (this.config.resizeVolume) {
      console.log("resizeVolume", this.config.volumeSize);
      if (this.config.pad && this.config.padSize) {
        this.volume = padVolume(niiVolume.img2RAS(), this.dims, [
          this.config.padSize,
          this.config.padSize,
          this.config.padSize,
        ]);
        // this.maxVal = getMax(this.volume);
        console.log(
          "resizeVolume",
          this.volume.reduce((a, b) => a + b, 0),
          this.volume.length
        );
      }
    } else {
      this.volume = niiVolume.img2RAS();
    }
    if (this.config.normalize) {
      this.volume = normalizeArray(
        this.volume,
        this.maxVal,
        getMin(this.volume)
      );
      console.log(
        "normalize",
        getMin(this.volume),
        getMax(this.volume),
        this.volume.reduce((a, b) => a + b, 0),
        this.volume.length
      );
    } else {
      this.volume = niiVolume.img2RAS();
    }

    if (
      this.config.standardize.enabled &&
      this.config.standardize.mean &&
      this.config.standardize.std
    ) {
      this.volume = standardizeArray(
        niiVolume.img2RAS(),
        this.config.standardize.mean[0],
        this.config.standardize.std[0]
      );
    }

    return this.volume;
  };

  process = (sliceId: number): PreprocessorResult => {
    let inputTensor: ort.Tensor;

    let sliceArray = this.volume.slice(
      this.dims[0] * this.dims[1] * sliceId,
      this.dims[0] * this.dims[1] * (sliceId + 1)
    );
    let image3Channels = stackSliceToRGB(sliceArray);

    if (this.config.resizeLonger) {
      let mat = arrayToMat(image3Channels, [this.dims[0], this.dims[1]]);
      let resizedImage = resize(mat, this.config.size);
      console.log(
        "resizedImage",
        resizedImage.size().width,
        resizedImage.size().height,
        resizedImage.data.reduce((a, b) => a + b, 0)
      );
      if (this.config.pad && this.config.padSize) {
        let paddedImage = pad(resizedImage, this.config.padSize);
        console.log(
          "paddedImage",
          paddedImage.size().width,
          paddedImage.size().height,
          paddedImage.data.reduce((a, b) => a + b, 0)
        );
        let filteredImage = filterChannels(paddedImage.data, 3); // filter alpha channel
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
