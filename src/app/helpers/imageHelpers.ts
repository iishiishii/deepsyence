import * as Jimp from 'jimp';
import { Tensor } from 'onnxruntime-web';
import { max, min } from 'underscore';

export async function getImageTensorFromPath(path: string, dims: number[] =  [1, 3, 224, 224]): Promise<Tensor> {
  // 1. load the image  
  let image = await loadImageFromPath(path);
  // 2. Resize image
  let resizedImage = resize(image, dims[2], dims[3], "bicubicInterpolation")
  // 3. convert to tensor
  let imageTensor = imageDataToTensor(image, dims);
  // 4. return the tensor
  return imageTensor;
};

export function resize(image: Jimp, width: number = 224, height: number = 224, mode: string = "bicubicInterpolation"): Jimp {
  return image.resize(width, height, mode);
};

export function resize_longer(image: Jimp, size: number, longer: boolean, mode: string = Jimp.default.RESIZE_BILINEAR): Jimp {
  if (longer) {
    if (image.bitmap.width > image.bitmap.height) {
      return image.resize(size, Jimp.default.AUTO, mode);
    } else {
      return image.resize(Jimp.default.AUTO, size, mode);
    }
  } else {
    if (image.bitmap.width < image.bitmap.height) {
      return image.resize(size, Jimp.default.AUTO, mode);
    } else {
      return image.resize(Jimp.default.AUTO, size, mode);
    }
  }
};
export async function maskImage(path: string, mask: Array<number>, imgWidth: number, imgHeight: number): Promise<Jimp> {
  // 1. load the image
  let image = await loadImageFromPath(path);
  for (let x=0; x < imgWidth; x++) {
    for (let y=0; y < imgHeight; y++) {
      let i = y + x * imgHeight
      let j = x + y * imgWidth     
      if (mask[j] === 0) {
        image.bitmap.data[i * 4] = 0;
        image.bitmap.data[i * 4 + 1] = 0;
        image.bitmap.data[i * 4 + 2] = 0;
        image.bitmap.data[i * 4 + 3] = 0;
      }
    }
  }
  return image;
};

export async function loadImageFromPath(path: string): Promise<Jimp> {
  // Use Jimp to load the image and resize it.
  let imageData = await Jimp.default.read(path)
  return imageData;
};

export async function imageToDataURL(img: Jimp): Promise<string> {
  // Use Jimp to load the image and resize it.
  const imgSrc = await img.getBase64Async('image/jpeg');
  return imgSrc;
};

export function getChannel(image: Jimp, channel: number): Array<number> {
  // 1. Get buffer data from image and create R, G, and B arrays.
  let imageBufferData = image.bitmap.data;
  const channelArray = new Array<number>();
  
  // 2. Loop through the image buffer and extract the R, G, and B channels
  for (let i = 0; i < imageBufferData.length; i += 4) {
    channelArray.push(imageBufferData[i + channel]);
    // skip data[i + 3] to filter out the alpha channel
  }
  return channelArray;
};

export function replaceChannel(image: Jimp, channel: number, channelArray: Array<number>): Jimp {
  // 1. Get buffer data from image and create R, G, and B arrays.
  let imageBufferData = image.bitmap.data;
  
  // 2. Create a new image with the same dimensions as the input image
  const outImage = new (Jimp as any)(image.bitmap.width, image.bitmap.height, 0x000000ff);

  // 3. round out value sto jimp values [0-255]
  for (let i = 0; i < imageBufferData.length; i += 4) {
    outImage.bitmap.data[i] = Math.round(imageBufferData[i]);
    outImage.bitmap.data[i + 1] = Math.round(imageBufferData[i+1]);
    outImage.bitmap.data[i + 2] = Math.round(imageBufferData[i+2]);
    outImage.bitmap.data[i + 3] = imageBufferData[i + 3];
    outImage.bitmap.data[i + channel] = channelArray[i/4];
  }

  return outImage;
};

export function transposeChannelDim(imageBufferData: Buffer | Float32Array, dims: number = 4): Array<number> {
  // 1. Get buffer data from image and create R, G, and B arrays.
  const [redArray, greenArray, blueArray] = [new Array<number>(), new Array<number>(), new Array<number>()];

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
};

export function inverseTransposeChannelDim(transposedData: Array<number> | Float32Array, dims: number = 4): Float32Array {
  const length = transposedData.length;
  const channelSize = length / dims;
  const originalData = new Float32Array(length);
  
  // The starting indices for the red, green, and blue channels in the transposed data
  const redStart = 0;
  const greenStart = channelSize;
  const blueStart = 2 * channelSize;

  for (let i = 0; i < channelSize; ++i) {
    originalData[i * dims] = transposedData[redStart + i];
    originalData[i * dims + 1] = transposedData[greenStart + i];
    originalData[i * dims + 2] = transposedData[blueStart + i];
    // Skip alpha channel or other dims: originalData[i * dims + 3] = ...;
  }

  return originalData;
}

export function convertImgToFloat(image: Array<number>, dims: number[]): Float32Array {
  // 4. convert to float32
  let i, l = image.length; // length, we need this for the loop
  console.log("image.length", image, dims)
  // create the Float32Array size 3 * 224 * 224 for these dimensions output
  const float32Data = new Float32Array(image.length*3/4);
  for (i = 0; i < l; i+=4) {
    float32Data[3*i/4] = image[i]; // convert to float
    float32Data[3*i/4+1] = image[i+1]; // convert to float
    float32Data[3*i/4+2] = image[i+2]; // convert to float
    // skip image[i + 3] to filter out the alpha channel
  }
  console.log("float32Data", float32Data)
  return float32Data;
};

export function scaleImgToFloat(image: Array<number>, dims: number[], scale: number = 1./255.): Float32Array {
  // 4. convert to float32
  let i, l = image.length; // length, we need this for the loop
  // create the Float32Array size 3 * 224 * 224 for these dimensions output
  const float32Data = new Float32Array(dims[1] * dims[2] * dims[3]);
  for (i = 0; i < l; i++) {
    float32Data[i] = image[i] * scale; // convert to float
  }
  return float32Data;
};

export function convertFloatToInt8(float32Data: Float32Array): Array<number> {
  // 4. convert to float32
  let i, l = float32Data.length; // length, we need this for the loop
  // create the Float32Array size 3 * 224 * 224 for these dimensions output
  const ImgData = new Array<number>();
  for (i = 0; i < l; i++) {
    ImgData.push(Math.min(255, Math.max(0, Math.round(float32Data[i] * 255.0)))); // convert to float
  }
  return ImgData;
};

export function convertFloatToImg(float32Data: Float32Array, dims: number[], rgb: boolean): Jimp {
  // 4. convert to float32
  let i, l = float32Data.length; // length, we need this for the loop
  console.log("float32Data.length", float32Data)
  // create the Float32Array size 3 * 224 * 224 for these dimensions output
  const ImgData = new (Jimp.default as any)(dims[0], dims[1], 0x000000ff);
  console.log("dims", dims)
  if (rgb) {
    for (i = 0; i < l; i += 3) {
      ImgData.bitmap.data[4*i/3] =  Math.round(float32Data[i] * 255.0); // convert to float
      ImgData.bitmap.data[4*i/3+1] = Math.round(float32Data[i+1] * 255.0); // convert to float
      ImgData.bitmap.data[4*i/3+2] = Math.round(float32Data[i+2] * 255.0); // convert to float
      ImgData.bitmap.data[4*i/3+3] = 255; // convert to float
    }
  } else {
    for (i = 0; i < l; i += 3) {
      ImgData.bitmap.data[4*i/3] =  float32Data[i]; // convert to float
      ImgData.bitmap.data[4*i/3+1] = float32Data[i+1]; // convert to float
      ImgData.bitmap.data[4*i/3+2] = float32Data[i+2]; // convert to float
      ImgData.bitmap.data[4*i/3+3] = 255; // convert to float
    }
  }

  return ImgData;
};

export function convertArrayToImg(uint8Data: Uint8Array, dims: number[]): Jimp {
  let i, l = uint8Data.length; // length, we need this for the loop
  // create the Float32Array size 3 * 224 * 224 for these dimensions output
  const ImgData = new (Jimp.default as any)(dims[0], dims[1], 0x000000ff);
  for (i = 0; i < l; i += 3) {
    ImgData.bitmap.data[4*i/3] = uint8Data[i]; // convert to float
    ImgData.bitmap.data[4*i/3+1] = uint8Data[i+1]; // convert to float
    ImgData.bitmap.data[4*i/3+2] = uint8Data[i+2]; // convert to float
    ImgData.bitmap.data[4*i/3+3] = 0; // convert to float
  }
  return ImgData;
}

export function convertArrayToTensor(float32image: Float32Array, dims: number[]): Tensor {
  const inputTensor = new Tensor("float32", float32image, dims);
  return inputTensor;
};

export function imageDataToTensor(image: Jimp, dims: number[]): Tensor {
  // 1. Get buffer data from image and create R, G, and B arrays.
  let imageBufferData = image.bitmap.data;

  // 2. Concatenate RGB to transpose [224, 224, 3] -> [3, 224, 224] to a number array
  const transposedData = transposeChannelDim(imageBufferData);

  // 3. convert to float32
  const float32Data = convertImgToFloat(transposedData, dims);

  // 4. create the tensor object from onnxruntime-web.
  const inputTensor = convertArrayToTensor(float32Data, dims);
  return inputTensor;
};

export function imageRGBToYCC(image: Jimp): Jimp {
  // 1. Get buffer data from image and create R, G, and B arrays.
  let imageBufferData = image.bitmap.data;
  const width = image.bitmap.width
  const height = image.bitmap.height

  // 2. Concatenate YCC to transpose [224, 224, 3] -> [3, 224, 224] to a number array
  const outImage = new (Jimp as any)(width, height, 0x000000ff); // create a new image with the same dimensions as the input image
  // 3. round out value sto jimp values [0-255]
  for (let i = 0; i < imageBufferData.length; i+=4) {
    let red = imageBufferData[i];
    let green = imageBufferData[i + 1];
    let blue = imageBufferData[i + 2];
    outImage.bitmap.data[i] = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);
    outImage.bitmap.data[i + 1] = Math.round(128 - 0.168736 * red - 0.331264 * green + 0.5 * blue);
    outImage.bitmap.data[i + 2] = Math.round(128 + 0.5 * red - 0.418688 * green - 0.081312 * blue);
    outImage.bitmap.data[i + 3] = image.bitmap.data[i + 3];
  }
  // 4. return the image
  return outImage;
};


export function imageYCCToRGB(image: Jimp): Jimp {
  // 1. Get buffer data from image and create R, G, and B arrays.
  let imageBufferData = image.bitmap.data;

  const width = image.bitmap.width
  const height = image.bitmap.height
  // 2. Concatenate YCC to transpose [224, 224, 3] -> [3, 224, 224] to a number array
  const outImage = new (Jimp as any)(width, height, 0x000000ff); // create a new image with the same dimensions as the input image
  let y = imageBufferData[0];
  let cb = imageBufferData[1];
  let cr = imageBufferData[2];

  // 3. round out value sto jimp values [0-255]
  for (let i = 0; i < imageBufferData.length; i+=4) {
    y = imageBufferData[i];
    cb = imageBufferData[i + 1];
    cr = imageBufferData[i + 2];
    outImage.bitmap.data[i] = Math.round(y + 1.402 * (cr - 128));
    outImage.bitmap.data[i + 1] = Math.round(y - 0.344136 * (cb - 128) - 0.714136 * (cr - 128));
    outImage.bitmap.data[i + 2] = Math.round(y + 1.772 * (cb - 128));
    outImage.bitmap.data[i + 3] = image.bitmap.data[i + 3];
  }
  // 4. return the image
  return outImage;
};

export function crop(image: Jimp, croppedwidth: number, croppedheight: number): Jimp {
  const startX = (image.bitmap.width - croppedwidth) / 2;
  const startY = (image.bitmap.height - croppedheight) / 2;
  image = image.crop(
    startX, startY,
    croppedwidth, croppedheight
  );
  return image;
};

export function pad(image: Jimp, padSize: number, center: boolean = false): Jimp {
  // Get dimensions of the original image
  const width = image.getWidth();
  const height = image.getHeight();
  console.log("image before padding", image, image.bitmap.data.reduce((a,b) => a+b, 0))

  // Create a new blank image with the padded dimensions
  const paddedImage = new (Jimp.default as any)(padSize, padSize, 0x00000000)
  if (center) {
    const startX = (padSize - width) / 2;
    const startY = (padSize - height) / 2;  
    paddedImage.composite(image, startX, startY);
  } else {
    paddedImage.composite(image, 0, 0);
  };
  console.log("image after padding", paddedImage, paddedImage.bitmap.data.reduce((a: number,b: number) => a+b, 0))

  // Place the original image into the padded image
  return paddedImage;
};

export function padToSquare(image: Jimp): Jimp {
  const padSize = Math.max(image.bitmap.width, image.bitmap.height);
  const paddedimage = pad(image, padSize);
  return paddedimage;
};

export function normalizeAndTranspose(image: Jimp, mean: number[], std: number[]): Float32Array {
  let imageBufferData = image.bitmap.data;
  const [redArray, greenArray, blueArray] = [new Array<number>(), new Array<number>(), new Array<number>()];
  const height = image.bitmap.height
  const width = image.bitmap.width

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x >= image.bitmap.width || y >= image.bitmap.height) {
        redArray.push(0.0);
        greenArray.push(0.0);
        blueArray.push(0.0);
        continue;
      }
      const color = image.getPixelColor(x, y);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const rgba = Jimp.default.intToRGBA(color);
      let value = (rgba.r / 255 - mean[0]) / std[0]
      redArray.push(value);
      value = (rgba.g / 255 - mean[0]) / std[0]
      greenArray.push(value);
      value = (rgba.b / 255 - mean[0]) / std[0]
      blueArray.push(value);
    }
  }
  const imagedata = redArray.concat(greenArray).concat(blueArray);
  const float32Data = new Float32Array(imagedata);
  return float32Data;
}

export function normalize(image: Uint8Array, mean: number[], std: number[]): Float32Array {
  // 1. Get buffer data from image and create R, G, and B arrays.
  let imageBufferData = new Float32Array(image);
  // const [redArray, greenArray, blueArray] = new Array(new Array<number>(), new Array<number>(), new Array<number>());
  let minVal = 0, maxVal = 0;
  // // 2. Loop through the image buffer and extract the R, G, and B channels
  const float32Data = new Float32Array(imageBufferData.length*3/4);
  for (let i = 0; i < imageBufferData.length; i += 4) {
    float32Data[3*i/4] = (imageBufferData[i] - mean[0]) / std[0];
    minVal = Math.min(float32Data[3*i/4], minVal);
    maxVal = Math.max(float32Data[3*i/4], maxVal);
    float32Data[3*i/4 +1] = (imageBufferData[i + 1] - mean[1]) / std[1];
    minVal = Math.min(float32Data[3*i/4 +1], minVal);
    maxVal = Math.max(float32Data[3*i/4 +1], maxVal);
    float32Data[3*i/4 + 2] = (imageBufferData[i + 2] - mean[2]) / std[2];
    minVal = Math.min(float32Data[3*i/4 +2], minVal);
    maxVal = Math.max(float32Data[3*i/4 +2], maxVal);
    // skip data[i + 3] to filter out the alpha channel
  }
  console.log("minVal", minVal, maxVal)
  console.log("normalized array", float32Data, float32Data.reduce((a,b) => a+b, 0))

  return float32Data;
};

export const overlayMasksOnImage = async (image: Jimp, masks: [Jimp], x: number = 0, y: number = 0, alpha: number = 0.5) => {
  // Read the main image
  // Iterate over each mask path and apply it to the image
  for (const mask of masks) {
    mask.opacity(alpha); // Set opacity of the mask
    image.composite(mask, x, y); // Overlay the mask
  }

  // Save or return the result
  return image;
};
