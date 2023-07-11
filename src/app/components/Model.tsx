// https://github.com/michael-burrows-github/blog/blob/master/2020/035%20-%20Build%20a%20React%20sidebar%20navigation%20component/src/App.js

import * as React from "react";

import "../../assets/css/global.css";

import * as ort from "onnxruntime-web";

function Model() {
  const onnxFunct = async () => {
    try {
      // create a new session and load the specific model

      // the model in this example contains a single MatMul node
      // it has 2 inputs: 'a'(float32, 3x4) and 'b'(float32, 4x3)
      // it has 1 output: 'c'(float32, 3x3)
      ort.env.wasm.wasmPaths = new URL(
        "./assets/onnxruntime-web/",
        document.baseURI,
      ).href;
      // @ts-ignore
      let session = await ort.InferenceSession.create(
        "./assets/model/model_dynamic.onnx",
      );
      const float32Data = new Float32Array(211 * 224 * 224).fill(1);
      // console.log(image.dims.slice(1).concat([1]))
      // const inputTensor = new ort.Tensor("float32", float32Data, image.dims.slice(1).concat([1]));
      const inputTensor = new ort.Tensor(
        "float32",
        float32Data,
        [211, 224, 224, 1],
      );
      //const dataA =  Float32Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
      //const dataB = Float32Array.from([10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120])
      //const tensorA = new ort.Tensor('float32', dataA, [3, 4])
      //const tensorB = new ort.Tensor('float32', dataB, [4, 3])

      // prepare feeds. use model input names as keys
      //const feeds = { a: tensorA, b: tensorB }
      let feeds = { input_2: inputTensor };

      // feed inputs and run
      let results = await session.run(feeds, ["conv2d_transpose_9"]);

      // read from results
      const dataC = results;
      console.log(`data of result tensor 'c': ${dataC}`);
      // feed inputs and run
      //const results = await session.run(feeds)

      // read from results
      //const dataC = results.c.data
      //console.log(`data of result rensor 'c': ${dataC}`)
      return dataC;
    } catch (e) {
      console.log(`failed to inference ONNX model: ${e}. `);
    }
  };

  React.useEffect(() => {
    let result = onnxFunct();

    // return () => { // clean-up function
    // }
  }, []);

  // return (
  //   <>
  //   </>
  // );
}

export default Model;
