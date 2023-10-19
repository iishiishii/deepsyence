import * as ort from "onnxruntime-web";
import { colToRow, rowToCol } from "./maskUtils";

export const brainExtractionModel = async (
  image: any,
  onModel: (id: any, name: any, array: any) => void,
) => {
  try {
    let id = image.id;
    let name = image.name;

    ort.env.wasm.wasmPaths = new URL("./js/", document.baseURI).href;

    console.log(ort.env.wasm.wasmPaths);
    // @ts-ignore

    let modelUrl = new URL("./model/model_dynamic.onnx", document.baseURI).href;
    console.log(modelUrl);

    let session = await ort.InferenceSession.create(modelUrl, {
      executionProviders: ["wasm"],
    });

    const float32Data = colToRow(image, image.img);
    console.log(image.dims.slice(1).concat([1]));
    console.log(`${float32Data.reduce((partialSum, a) => partialSum + a, 0)}`);
    const inputTensor = new ort.Tensor(
      "float32",
      float32Data,
      image.dims.slice(1).concat([1]),
    );

    // eslint-disable-next-line camelcase
    let feeds = { input_2: inputTensor };

    // feed inputs and run
    let results = await session.run(feeds, ["conv2d_transpose_9"]);

    // read from results
    const newImage = results["conv2d_transpose_9"].data;
    console.log(newImage);
    const rasImage = rowToCol(image, newImage);
    onModel(id, name, rasImage);
  } catch (e) {
    console.log(`failed to inference ONNX model: ${e}. `);
  }
};
