// thresholding the output of the model to create a mask for a given slice
export function maskImage(
  input: Float32Array,
  width: number,
  height: number,
  sliceId: number,
  mask: Uint8Array
) {
  // let output = new Array(width * height * sliceId).fill(0); // fill to selected slice
  const threshold = 0;
  try {
    for (let i = 0; i < width * height; i++) {
      mask[width * height * sliceId + i] = input[i] > threshold ? 1 : 0;
    }
    // for (let i = 0; i < width * height; i++) {
    //   mask[width * height * (sliceId + 1) + i] =
    //     input[i + width * height] > threshold ? 2 : 0;
    // }
    // for (let i = 0; i < width * height; i++) {
    //   mask[width * height * (sliceId + 2) + i] =
    //     input[i + width * height * 2] > threshold ? 3 : 0;
    // }
    // output = output.concat(Array.from(input));
  } catch (error) {
    console.log("error", error);
  }
}

// thresholding the output of the model to create a mask for the entire volume
export function maskVolume(
  input: Float32Array | Uint8Array,
  width: number,
  height: number,
  depth: number,
  mask: Uint8Array
): Uint8Array {
  // let output = new Array(width * height * sliceId).fill(0); // fill to selected slice
  const threshold = 0;
  try {
    for (let i = 0; i < width * height * depth; i++) {
      mask[i] = input[i] > threshold ? 1 : 0;
    }
    // output = output.concat(Array.from(input));
  } catch (error) {
    console.log("error", error);
  }
  return mask;
}
