import * as ort from "onnxruntime-web";
import { modelInputProps } from "./Interfaces";
import { modelData } from "./onnxModelAPI";
import { onnxMaskToImage } from "./maskUtils";

export const samModel = async (
  image: any,
  tensor: ort.TypedTensor<"string">,
  clicks: modelInputProps[],
  onModel: (id: any, name: any, array: any) => void,
) => {
  const start = new Date();
  try {
    let id = image.id;
    let name = image.name;

    // Promise.resolve(loadNpyTensor(IMAGE_EMBEDDING, "float32")).then(
    //   (embedding) => {
    //     console.log(embedding)
    //     setTensor(embedding);
    //   }
    // );
    console.log("dims ", image.dims, tensor, clicks);
    const LONG_SIDE_LENGTH = 1024;
    let w = image.dims[1];
    let h = image.dims[2];
    const samScale = LONG_SIDE_LENGTH / Math.max(h, w);
    const modelScale = {
      samScale: samScale,
      height: w, // swap height and width to get row major order from npy arrayt to column order ?
      width: h,
    };

    ort.env.wasm.wasmPaths = new URL("./js/", document.baseURI).href;

    console.log(ort.env.wasm.wasmPaths);
    // @ts-ignore

    let model_url = new URL(
      "./model/sam_onnx_quantized_example.onnx",
      document.baseURI,
    ).href;
    console.log(model_url);

    let session = await ort.InferenceSession.create(model_url, {
      executionProviders: ["wasm"],
    });

    // prepare feeds. use model input names as keys
    //const feeds = { a: tensorA, b: tensorB }
    // let feeds = { input_2: input };
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
    const inferenceTime = (end.getTime() - start.getTime());
    console.log("inference time ", inferenceTime)
    // read from results
    const newImage = results[session.outputNames[0]].data;
    const output = results[session.outputNames[0]].data;

    console.log("newImage ", output);
    const rasImage = onnxMaskToImage(output, w, h);
    onModel(id, name, rasImage);
  } catch (e) {
    console.log(`failed to inference ONNX model: ${e}. `);
  }
};

export const samEncoder = async (image: any) => {
  const start = new Date();
  try {
    // let id = image.id;
    // let name = image.name;
    const LONG_SIDE_LENGTH = 1024;
    const array = image;

    const tensor = new ort.Tensor("float32", array, [1, 3, 1024, 1024]);
    ort.env.wasm.wasmPaths = new URL("./js/", document.baseURI).href;

    console.log(ort.env.wasm.wasmPaths);
    // @ts-ignore

    let model_url = new URL("./model/encoder-quant.onnx", document.baseURI)
      .href;
    console.log(model_url);

    let session = await ort.InferenceSession.create(model_url, {
      executionProviders: ["wasm"],
    });

    const feeds = {
      x: tensor,
    };
    console.log("feeds ", feeds);
    if (feeds === undefined) return;
    // feed inputs and run
    let results = await session.run(feeds);
    const end = new Date();
    const inferenceTime = (end.getTime() - start.getTime());
    console.log("inference time ", inferenceTime)

    const output = results[session.outputNames[0]].data;

    console.log("newImage ", output);
    return output;
  } catch (e) {
    console.log(`failed to inference ONNX model: ${e}. `);
  }
};
