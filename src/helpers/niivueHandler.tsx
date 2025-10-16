import { sliceTypeMap } from "@/components/segmentation-inference/image-canvas";
import { Niivue, NVImage } from "@niivue/niivue";
import { v4 as uuid } from "uuid";
import { TypedVoxelArray } from "@/helpers/utils/imageConversion";

export function updateSliceType(
  nv: Niivue,
  newSliceType: keyof typeof sliceTypeMap
) {
  nv.setSliceType(sliceTypeMap[newSliceType]);
}

function setImage(
  nv: Niivue,
  id: string,
  name: string,
  array: Float32Array | Uint8Array | Int16Array | Float64Array | Uint16Array,
) {
  let modelOutput = nv.volumes[nv.getVolumeIndexByID(id)];
  // console.log("processed image ", array);
  if (!modelOutput) {
    console.log("image not found");
    return;
  }
  // console.log("model output ", modelOutput);
  let processedImage = modelOutput.clone();
  if (!processedImage) {
    console.log("image not found");
    return;
  }
  processedImage.zeroImage();
  processedImage.name = name;
  processedImage.permRAS = [1, 2, 3];

  processedImage.hdr!.datatypeCode = 2;
  processedImage.img = array as TypedVoxelArray;

  processedImage.trustCalMinMax = false;
  processedImage.calMinMax();
  processedImage.dims = modelOutput.dims;
  // console.log("processed image", processedImage);
  // console.log(
  //   processedImage.img.reduce(
  //     (partialSum: number, a: number) => partialSum + a,
  //     0,
  //   ),
  // );
  return processedImage;
}

export function nvDrawMask(nv: any, id: string, name: string, array: Uint8Array) {
  let processedImage = setImage(nv, id, name, array);
  nv.loadDrawing(processedImage);
  nv.setDrawColormap("$slicer3d");
  // nv.addVolume(processedImage);
  // setLayers([...nv.volumes]);

  console.log("image processed");
}
