export function stackSliceToRGB(
  buffer: Float32Array | Uint16Array | Uint8Array
): Float32Array {
  let bufferLength = buffer.length,
    result = new Float32Array(bufferLength * 3);

  for (let i = 0; i < bufferLength; i++) {
    result[3 * i] = buffer[i];
    result[3 * i + 1] = buffer[i];
    result[3 * i + 2] = buffer[i];
  }
  return result;
}

// TODO: should work for how many channels?
export function addChannel(
  buffer: Float32Array | Uint16Array | Uint8Array
): Uint8Array {
  let bufferLength = buffer.length,
    result = new Uint8Array((bufferLength / 3) * 4);

  for (let i = 0; i < bufferLength; i += 3) {
    result[(4 * i) / 3] = buffer[i] * 1;
    result[(4 * i) / 3 + 1] = buffer[i + 1] * 1;
    result[(4 * i) / 3 + 2] = buffer[i + 2] * 1;
    result[(4 * i) / 3 + 3] = 255;
  }
  return result;
}

export function filterChannels(
  image: Float32Array | Uint8Array | Array<number>,
  keepChannels: number = 1
): Float32Array {
  let i,
    l = image.length;
  const float32Data = new Float32Array((image.length * keepChannels) / 4);
  for (i = 0; i < l; i += 4) {
    for (let j = 0; j < keepChannels; j++) {
      float32Data[(keepChannels * i) / 4 + j] = image[i + j];
    }
  }
  return float32Data;
}

export function transposeChannelDim(
  imageBufferData: Buffer | Float32Array,
  dims: number = 4
): Array<number> {
  // 1. Get buffer data from image and create R, G, and B arrays.
  const [redArray, greenArray, blueArray] = [
    new Array<number>(),
    new Array<number>(),
    new Array<number>(),
  ];

  // 2. Loop through the image buffer and extract the R, G, and B channels
  for (let i = 0; i < imageBufferData.length; i += dims) {
    redArray.push(imageBufferData[i]);
    greenArray.push(imageBufferData[i + 1]);
    blueArray.push(imageBufferData[i + 2]);
    // skip data[i + 3] to filter out the alpha channel
  }

  // 3. Concatenate RGB to transpose [224, 224, 3] -> [3, 224, 224] to a number array
  const transposedData = redArray.concat(greenArray).concat(blueArray);
  return transposedData;
}

export function colToRow(
  dims: number[],
  colArray: Float32Array | Uint16Array | Uint8Array
) {
  // let dims = image.dimsRAS;
  let rowArray = new Float32Array(dims[0] * dims[1] * dims[2]);
  console.log(dims);
  for (let i = 0; i < dims[0]; i++) {
    for (let j = 0; j < dims[1]; j++) {
      for (let k = 0; k < dims[2]; k++) {
        let indexCol = i + j * dims[0] + k * dims[0] * dims[1];
        let indexRow = i * dims[1] * dims[2] + j * dims[2] + k;
        rowArray[indexRow] = colArray[indexCol];
      }
    }
  }
  return rowArray;
}

export function rowToCol(
  dims: number[],
  rowArray: Float32Array | Uint16Array | Uint8Array
) {
  // let dims = image.dimsRAS;
  let colArray = new Float32Array(dims[0] * dims[1] * dims[2]);
  console.log(dims);
  for (let i = 0; i < dims[0]; i++) {
    for (let j = 0; j < dims[1]; j++) {
      for (let k = 0; k < dims[2]; k++) {
        let indexCol = i + j * dims[0] + k * dims[0] * dims[1];
        let indexRow = i * dims[1] * dims[2] + j * dims[2] + k;
        colArray[indexCol] = rowArray[indexRow];
      }
    }
  }
  return colArray;
}
