// The following is modified from Justin Harris's project:
// https://github.com/juharris/train-pytorch-in-js

// Modified from https://github.com/cazala/mnist/blob/master/src/mnist.js
// so that we can place the data in a specific folder and avoid out of memory errors
// and use TypeScript.
import * as ort from "onnxruntime-web/training";
import { Jimp, JimpConstructorOptions, JimpInstance, intToRGBA } from "jimp";
import { NVImage, Niivue } from "@niivue/niivue";

export class MriData {
  static readonly BATCH_SIZE = 1;
  static readonly MAX_NUM_TRAIN_SAMPLES = 200;
  static readonly MAX_NUM_TEST_SAMPLES = 1;

  static readonly pixelMax = 255;
  static readonly pixelMean = [0.485, 0.456, 0.406];
  static readonly pixelStd = [0.229, 0.224, 0.225];

  constructor(
    public batchSize = MriData.BATCH_SIZE,
    public trainingData: NVImage[] = [],
    public testingData: NVImage[] = [],
    public maxNumTrainSamples = MriData.MAX_NUM_TRAIN_SAMPLES,
    public maxNumTestSamples = MriData.MAX_NUM_TEST_SAMPLES
  ) {
    if (batchSize <= 0) {
      throw new Error("batchSize must be > 0");
    }
  }

  // inputs = [new URL("./data/images/elephant/elephant01.jpeg", document.baseURI).href];
  // input_paths = [new URL("./data/lesion/sub-M2001_ses-1076_acq-tfl3_run-4_T1w.nii.gz", document.baseURI).href];
  public static label_dict: { [key: number]: string } = {
    0: "no-lesion",
    1: "lesion",
  };

  public getNumTrainingBatches(): number {
    return Math.floor(this.maxNumTrainSamples / this.batchSize);
  }

  public getNumTestBatches(): number {
    return Math.floor(this.maxNumTestSamples / this.batchSize);
  }

  private *batches(data: ort.Tensor[], labels: ort.Tensor[]) {
    for (let batchIndex = 0; batchIndex < data.length; ++batchIndex) {
      yield {
        data: data[batchIndex],
        labels: labels[batchIndex],
      };
    }
  }

  public async *trainingBatches() {
    // Avoid keeping data in memory.
    const trainingImages = await this.prepareImagesTensor(this.trainingData);
    const trainingLabels = await this.prepareLabelsTensor(this.trainingData);
    if (!trainingImages || !trainingLabels) {
      throw new Error("No training data available");
    }
    yield* this.batches(trainingImages, trainingLabels);
  }

  public async *testingBatches() {
    // Avoid keeping data in memory.
    const testingImages = await this.prepareImagesTensor(this.testingData);
    const testingLabels = await this.prepareLabelsTensor(this.testingData);
    if (!testingImages || !testingLabels) {
      throw new Error("No testing data available");
    }
    yield* this.batches(testingImages, testingLabels);
  }

  private getNumberOfSubjects(data: NVImage[]): number {
    for (let i = 0; i < data.length; i++) {
      if (!data[i].name.includes("lesion")) {
        throw new Error("Name your data to include 'lesion' or 'no-lesion'");
      }
    }
    return this.trainingData.length;
  }

  public static getSlice = (image: NVImage, idx: number): ort.Tensor => {
    if (!image.img || !image.dimsRAS) {
      throw new Error("Image data not loaded in getSlice");
    }
    // let slices: ort.Tensor[] = new Array();
    if (idx < 0 || idx >= image.dimsRAS[3]) {
      throw new Error("Index out of bounds in getSlice");
    }

    const slice = image.img.slice(
      idx * image.dimsRAS[1] * image.dimsRAS[2],
      (idx + 1) * image.dimsRAS[1] * image.dimsRAS[2]
    );

    let slice_rgb = MriData.stackSliceToRGB(slice);
    // console.log("slice_rgb", slice_rgb);
    let jimp = new Jimp({
      data: Buffer.from(slice_rgb),
      width: image.dimsRAS[1],
      height: image.dimsRAS[2],
    });
    // console.log("jimp", jimp);
    // slices[i-startId] = this.process(jimp);

    return MriData.process(jimp);
  };

  prepareLabelsTensor = async (data: NVImage[]): Promise<ort.Tensor[]> => {
    if (data.length === 0) {
      throw new Error("No data provided to prepareLabelsTensor");
    }
    const results: ort.Tensor[] = [];
    const numSubs = this.getNumberOfSubjects(data); // number of subjects counted from the zipfile

    // const labels = new Array(this.inputs.length);
    for (let i = 0; i < numSubs; i++) {
      // let nii = await NVImage.loadFromUrl({url: this.input_paths[i]});
      for (let j = 0; j < data[i].dimsRAS![3]; j += this.batchSize) {
        let batch: ort.Tensor | undefined;
        for (const [key, value] of Object.entries(MriData.label_dict)) {
          if (data[i].name.includes(value)) {
            let label = new Array(this.batchSize).fill(parseInt(key));
            batch = new ort.Tensor("int64", label, [this.batchSize]);
            // console.log("label shape", this.batchSize, label, batch);
          }
        }
        if (!batch) {
          throw new Error(`Could not determine label for ${data[i].name}`);
        }
        results.push(batch);
      }
      console.log("labels results", results);
    }
    return results;
  };

  prepareImagesTensor = async (
    data: NVImage[]
  ): Promise<ort.Tensor[] | undefined> => {
    const results = [];
    const numSubs = this.getNumberOfSubjects(data); // number of subjects counted from the zipfile
    let tensors: ort.Tensor[] = [];

    for (let i = 0; i < numSubs; i++) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      for (let j = 0; j < data[i].dimsRAS[3]; j++) {
        // for (let j = 100; j < 110; j++) {

        let slice = MriData.getSlice(data[i], j);
        // console.log("slices", slice);
        tensors.push(slice);
      }
      //   console.log("inputs[i]", inputs[i]);
      //   const image = await Jimp.read(inputs[i]);

      //   tensors[i] = this.process(image);
    }
    console.log("tensors", tensors);
    if (tensors.length === 0) {
      console.log("No data found");
      return;
    }

    for (let i = 0; i < tensors.length; i += this.batchSize) {
      if (i + this.batchSize > this.maxNumTrainSamples) {
        console.log(
          "i, batchsize, max sample",
          i,
          this.batchSize,
          this.maxNumTestSamples
        );
        break;
      }
      let resultData: number[] = [];
      for (let k = 0; k < this.batchSize; k++) {
        for (let j = 0; j < tensors[0].data.length; j++) {
          // resultData.push(...tensors[i+k].data);
          resultData[k * tensors[0].data.length + j] = tensors[k + i].data[
            j
          ] as number;
        }
      }
      // console.log("resultData", resultData)
      // for (let j = 0; j < tensors[0].data.length*this.batchSize, k < this.batchSize; j++, k++) {
      //     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //     // @ts-ignore
      //     // console.log(i, "tensors[k].data[j]", k, j);
      //     resultData[k * tensors[0].data.length + j] = tensors[k].data[j];
      // }
      let batch = new ort.Tensor("float32", resultData as number[], [
        this.batchSize,
        tensors[0].dims[1],
        tensors[0].dims[2],
        tensors[0].dims[3],
      ]);
      results.push(batch);
    }
    console.log(
      "image tensor",
      [
        this.batchSize,
        tensors[0].dims[1],
        tensors[0].dims[2],
        tensors[0].dims[3],
      ],
      " results",
      results
    );
    return results;
  };

  public static process = (image): ort.Tensor => {
    // console.log("Processing image", image);
    try {
      image = image.resize({ w: 224, h: 224 });
      // console.log("process", image.bitmap.data)
    } catch (error) {
      console.error("Error resizing image", error);
    }
    // console.log("Resized image", image);
    const tensor = MriData.imageDataToTensor(image);
    return tensor;
  };

  /**
   * imageDataToTensor converts Jimp image to ORT tensor
   * @param image instance of Jimp image
   * @param dims target dimensions of the tensor
   * @returns ORT tensor
   */
  private static imageDataToTensor = (image): ort.Tensor => {
    const [redArray, greenArray, blueArray] = [
      new Array<number>(),
      new Array<number>(),
      new Array<number>(),
    ];
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x >= image.bitmap.width || y >= image.bitmap.height) {
          redArray.push(0.0);
          greenArray.push(0.0);
          blueArray.push(0.0);
          continue;
        }
        const color = image.getPixelColor(x, y);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const rgba = intToRGBA(color);
        // console.log("color", color, "rgb", rgba)

        let value = this.getValue(rgba.r, 0);
        redArray.push(value);
        value = this.getValue(rgba.g, 1);
        greenArray.push(value);
        value = this.getValue(rgba.b, 2);
        blueArray.push(value);
      }
    }
    let transposedData: number[] = [];

    transposedData = redArray.concat(greenArray).concat(blueArray);
    // console.log("redArray", redArray, "greenArray", greenArray, "blueArray", blueArray)
    const float32Data = new Float32Array(transposedData);
    const dims = [1, 3, height, width];
    const inputTensor = new ort.Tensor("float32", float32Data, dims);
    // console.log("inputTensor", inputTensor)
    return inputTensor;
  };

  private static getValue = (value: number, colorIdx: number): number => {
    value =
      (value / this.pixelMax - this.pixelMean[colorIdx]) /
      this.pixelStd[colorIdx];
    return value;
  };

  public static stackSliceToRGB(
    buffer: Float32Array | Uint8Array | Uint16Array | Int16Array | Float64Array
  ): Float32Array {
    let bufferLength = buffer.length,
      result = new Float32Array(bufferLength * 3);

    for (let i = 0; i < bufferLength; i++) {
      result[3 * i] = buffer[i] * 255;
      result[3 * i + 1] = buffer[i] * 255;
      result[3 * i + 2] = buffer[i] * 255;
    }
    return result;
  }
}
