import { NVImage } from '@niivue/niivue';
import { Tensor } from 'onnxruntime-web';


export function getImageTensor(array, dims =  [211,224,224,1]) {
  // 1. convert to tensor
  const dim = dims.reduce( (a, b) => a * b )
  if (array.length < dim ) {
    array = Array.from({...array, length:dim}).fill(0)
  } else {
    array = array.slice(0,dim)
  }

  const inputTensor = new Tensor("float32", array, dims);
  return inputTensor;
}

