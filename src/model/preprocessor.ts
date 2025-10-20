import { PreprocessorConfig } from "@/model/preprocessorConfig";
// import * as ort from "onnxruntime-common";
// import * as ort from "onnxruntime-web/training";
import {
  getMax,
  getMin,
  normalizeArray,
  pad,
  padVolume,
  resize,
  standardizeArray,
} from "@/helpers/utils/imageProcessing";
import {
  filterChannels,
  stackSliceToRGB,
} from "@/helpers/utils/channelHandlers";
import {
  arrayToMat,
  downloadImage,
  imageDataToTensor,
} from "@/helpers/utils/imageConversion";
import { PreprocessorResult } from "@/helpers/Interfaces";
import { Tensor } from "onnxruntime-web";
import MemoryPool from "@/helpers/utils/memoryPool";
import { NVImage } from "@niivue/niivue";
import { TypedVoxelArray } from "@/helpers/utils/imageConversion";
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

  processVolume = (niiVolume: NVImage): Float32Array => {
    if (!niiVolume.img2RAS) {
      throw new Error("The volume does not contain image data");
    }
    if (!niiVolume.dimsRAS) {
      throw new Error("The volume does not contain dimension data");
    }
    if (niiVolume.dimsRAS.length < 3) {
      throw new Error("The volume does not have 3 dimensions");
    }
    if (
      niiVolume.dimsRAS[1] * niiVolume.dimsRAS[2] * niiVolume.dimsRAS[3] !==
      niiVolume.img2RAS().length
    ) {
      throw new Error(
        "The volume dimensions do not match the image data length"
      );
    }
    this.dims = [
      niiVolume.dimsRAS[1],
      niiVolume.dimsRAS[2],
      niiVolume.dimsRAS[3],
    ];
    this.maxVal = getMax(niiVolume.img2RAS() as TypedVoxelArray);
    console.log(
      "ori volume",
      new Tensor("float32", [2.4]),
      getMin(niiVolume.img2RAS() as TypedVoxelArray),
      getMax(niiVolume.img2RAS() as TypedVoxelArray)
    );
    if (this.config.resizeVolume) {
      console.log("resizeVolume", this.config.volumeSize);
      if (this.config.pad && this.config.padSize) {
        this.volume = padVolume(
          niiVolume.img2RAS() as TypedVoxelArray,
          this.dims,
          [this.config.padSize, this.config.padSize, this.config.padSize]
        );
        // this.maxVal = getMax(this.volume);
        console.log(
          "resizeVolume",
          this.volume.reduce((a: number, b: number) => a + b, 0),
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
        this.volume.reduce((a: number, b: number) => a + b, 0),
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
        niiVolume.img2RAS() as TypedVoxelArray,
        this.config.standardize.mean[0],
        this.config.standardize.std[0]
      );
    }

    return this.volume;
  };

  process = (sliceId: number): PreprocessorResult => {
    let inputTensor: Tensor;

    let sliceArray = this.volume.slice(
      this.dims[0] * this.dims[1] * sliceId,
      this.dims[0] * this.dims[1] * (sliceId + 1)
    );
    let image3Channels = stackSliceToRGB(sliceArray);

    if (this.config.resizeLonger) {
      let mat = arrayToMat(image3Channels, [this.dims[0], this.dims[1]]);
      try {
        let resizedImage = resize(mat, this.config.size);
        // console.log(
        //   "resizedImage",
        //   resizedImage.size().width,
        //   resizedImage.size().height,
        //   resizedImage.data.reduce((a: number, b: number) => a + b, 0)
        // );
        try {
          if (this.config.pad && this.config.padSize) {
            let paddedImage = pad(resizedImage, this.config.padSize);
            // console.log(
            //   "paddedImage",
            //   paddedImage.size().width,
            //   paddedImage.size().height,
            //   paddedImage.data.reduce((a: number, b: number) => a + b, 0)
            // );
            try {
              let filteredImage = filterChannels(paddedImage.data, 3); // filter alpha channel
              const maxVal = getMax(filteredImage);
              let normalizedImage = normalizeArray(filteredImage, maxVal);
              console.log(
                "normalizedImage",
                normalizedImage.reduce((a, b) => a + b, 0)
              );
              inputTensor = new Tensor("float32", normalizedImage, [
                1,
                3,
                this.config.size,
                this.config.size,
              ]);
            } finally {
              if (paddedImage) paddedImage.delete();
            }
          } else {
            inputTensor = new Tensor("float32", resizedImage.data, [
              1,
              3,
              this.config.size,
              this.config.size,
            ]);
          }
        } finally {
          if (mat) mat.delete();
          if (resizedImage) resizedImage.delete();
        }
      } catch (error) {
        console.log("error during resizing", error);
        inputTensor = new Tensor("float32", image3Channels, [
          1,
          3,
          this.dims[0],
          this.dims[1],
        ]);
      }
    } else {
      inputTensor = new Tensor("float32", image3Channels, [
        1,
        3,
        this.dims[0],
        this.dims[1],
      ]);
    }
    console.log(
      "................ inputTensor",
      inputTensor,
      inputTensor.data.length
    );
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

  dispose = () => {
    this.volume = null;
    this.dims = [0, 0, 0];
    this.maxVal = 0;
  };
}

export default Preprocessor;
