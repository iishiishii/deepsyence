import { getImageTensor } from './dataobject';
import { runSqueezenetModel } from './model';

export async function inferenceSqueezenet(nvimage) {
  // 1. Convert image to tensor
  const imageTensor = await getImageTensor(nvimage);
  // 2. Run model
  const [processedImage, inferenceTime] = await runSqueezenetModel(imageTensor);
  // 3. Return predictions and the amount of time it took to inference.
  return [processedImage, inferenceTime];
}