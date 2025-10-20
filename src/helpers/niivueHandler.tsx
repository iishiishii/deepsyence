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

function setMaskToNiivue(
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
 let maskVolume = nv.volumes.find((v: NVImage) => v.name === name);

  if (!maskVolume) {
    // 3. If the mask volume doesn't exist, CLONE the template volume ONCE.
    // This is the only time cloning is acceptable, to set up the header/dims.
    maskVolume = modelOutput.clone(); 
    if (!maskVolume) return null;
    
    // Set initial properties
    maskVolume.name = name;
    maskVolume.zeroImage();
    // Use the most memory-efficient datatype for binary masks (Uint8)
    maskVolume.hdr!.datatypeCode = 2; // DT_UNSIGNED_CHAR (Uint8)
    maskVolume.permRAS = [1, 2, 3];
    // NOTE: If you use nv.loadDrawing(), you don't necessarily need to add it here.
    // nv.loadDrawing will add the mask volume internally if it's not present.
  }
  maskVolume.img = array as TypedVoxelArray;

  maskVolume.trustCalMinMax = false;
  maskVolume.calMinMax();
  maskVolume.dims = modelOutput.dims;
  // console.log("processed image", processedImage);
  // console.log(
  //   processedImage.img.reduce(
  //     (partialSum: number, a: number) => partialSum + a,
  //     0,
  //   ),
  // );
  return maskVolume;
}

export function nvDrawMask(nv: any, id: string, name: string, array: Uint8Array) {
  let processedImage = setMaskToNiivue(nv, id, name, array);
  nv.loadDrawing(processedImage);
  nv.setDrawColormap("$slicer3d");
  // nv.addVolume(processedImage);
  // setLayers([...nv.volumes]);

  console.log("image processed");
}
