import * as ort from 'onnxruntime-web';

export async function runSqueezenetModel(preprocessedData) {
  
  // Create session and set options. See the docs here for more options: 
  //https://onnxruntime.ai/docs/api/js/interfaces/InferenceSession.SessionOptions.html#graphOptimizationLevel
  const session = await ort.InferenceSession
                          .create('../model/model.onnx', 
                          { executionProviders: ['webgl'], graphOptimizationLevel: 'all' });
  console.log('Inference session created')
  // Run inference and get results.
  var [results, inferenceTime] =  await runInference(session, preprocessedData);
  return [results, inferenceTime];
}

async function runInference(session, preprocessedData) {
  // Get start time to calculate inference time.
  const start = new Date();
  // create feeds with the input name from model export and the preprocessed data.
  const feeds= {};
  feeds[session.inputNames[0]] = preprocessedData;
  
  // Run the session inference.
  const outputData = await session.run(feeds);
  // Get the end time to calculate inference time.
  const end = new Date();
  // Convert to seconds.
  const inferenceTime = (end.getTime() - start.getTime())/1000;
  // Get output results with the output name from the model export.
  const output = outputData[session.outputNames[0]];

  console.log('results: ', output);
  return [output, inferenceTime];
}
