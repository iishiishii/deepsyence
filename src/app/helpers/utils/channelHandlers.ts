export function stackSliceToRGB(buffer: Float32Array): Float32Array {
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
export function addChannel(buffer: Float32Array | Uint8Array): Uint8Array {
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

export function filterAlphaChannel(
  image: Float32Array | Uint8Array | Array<number>
): Float32Array {
  // 4. convert to float32
  let i,
    l = image.length; // length, we need this for the loop
  console.log("image.length", image.length);
  // create the Float32Array size 3 * 224 * 224 for these dimensions output
  const float32Data = new Float32Array((image.length * 3) / 4);
  for (i = 0; i < l; i += 4) {
    float32Data[(3 * i) / 4] = image[i]; // convert to float
    float32Data[(3 * i) / 4 + 1] = image[i + 1]; // convert to float
    float32Data[(3 * i) / 4 + 2] = image[i + 2]; // convert to float
    // skip image[i + 3] to filter out the alpha channel
  }
  // console.log("float32Data", float32Data)
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
