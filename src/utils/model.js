import * as ort from 'onnxruntime-web';

export async function runSqueezenetModel(preprocessedData) {
    // Create session and set options. See the docs here for more options: 
    //https://onnxruntime.ai/docs/api/js/interfaces/InferenceSession.SessionOptions.html#graphOptimizationLevel
    ort.env.wasm.wasmPaths = {
      'ort-wasm.wasm': './model/ort-wasm.wasm',
      'ort-wasm-simd.wasm': './model/ort-wasm-simd.wasm',
      'ort-wasm-threaded.wasm': './model/ort-wasm-threaded.wasm',
      'ort-wasm-simd-threaded.wasm': './model/ort-wasm-simd-threaded.wasm'
    };
    ort.env.wasm.numThreads = 1; // Number of thread(s) will be determined by system.
    ort.env.wasm.simd = true; // Enable SIMD.

    console.log('Inference session starts')
    const session = await ort.InferenceSession
                            .create('./model/model_dynamic.onnx', 
                            {
                              executionProviders: ['wasm'], graphOptimizationLevel: 'all'
                            });
    console.log('Inference session created')
    // Run inference and get results.
    console.log(preprocessedData)
        // Get start time to calculate inference time.
    const start = new Date();

    // create feeds with the input name from model export and the preprocessed data.
    const feeds= {input_2:preprocessedData};
    console.log(session.inputNames[0], session.outputNames[0])
    // feeds[session.inputNames[0]] = preprocessedData;
    try { 
    // Run the session inference.
    const outputData = await session.run(feeds);
    // Get the end time to calculate inference time.
    const end = new Date();
    console.log(end)
    // Convert to seconds.
    const inferenceTime = (end.getTime() - start.getTime())/1000;
    // Get output results with the output name from the model export.
    const output = outputData[session.outputNames[0]];

    console.log('results: ', output);
    return [output, inferenceTime];
  } catch (e) {
    console.error(e);
    throw new Error();
  }
}

async function runInference(session, preprocessedData) {

   
    // Get start time to calculate inference time.
    const start = new Date();

    // create feeds with the input name from model export and the preprocessed data.
    const feeds= {input_2:preprocessedData};
    console.log(session.inputNames[0], session.outputNames[0])
    // feeds[session.inputNames[0]] = preprocessedData;
    try { 
    // Run the session inference.
    const outputData = await session.run(feeds);
    // Get the end time to calculate inference time.
    const end = new Date();
    console.log(end)
    // Convert to seconds.
    const inferenceTime = (end.getTime() - start.getTime())/1000;
    // Get output results with the output name from the model export.
    const output = outputData[session.outputNames[0]];

    console.log('results: ', output);
    return [output, inferenceTime];
  } catch (e) {
    console.error(e);
    throw new Error();
  }
}
