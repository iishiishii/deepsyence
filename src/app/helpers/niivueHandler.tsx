import { viewType } from "../types";
import { v4 as uuid } from "uuid";

export function updateSliceType(nv: any, newSliceType: viewType) {
  if (newSliceType === "axial") {
    nv.setSliceType(nv.sliceTypeAxial);
  } else if (newSliceType === "coronal") {
    nv.setSliceType(nv.sliceTypeCoronal);
  } else if (newSliceType === "sagittal") {
    nv.setSliceType(nv.sliceTypeSagittal);
  } else if (newSliceType === "multi") {
    nv.setSliceType(nv.sliceTypeMultiplanar);
  } else if (newSliceType === "3d") {
    nv.setSliceType(nv.sliceTypeRender);
  }
}

function setImage(
  nv: any,
  id: any,
  name: any,
  array: Float32Array,
  niimath: boolean,
) {
  let modelOutput = nv.volumes[nv.getVolumeIndexByID(id)];
  console.log(
    "processed image ",
    modelOutput.img.reduce(
      (partialSum: number, a: number) => partialSum + a,
      0,
    ),
  );
  if (!modelOutput) {
    console.log("image not found");
    return;
  }
  console.log("model output ", modelOutput);
  let processedImage = modelOutput.clone();
  processedImage.id = uuid();
  processedImage.name = name.split(".")[0] + "_processed.nii.gz";
  processedImage.permRAS = [1,2,3];
  if (niimath) {
    processedImage.img = array;
    switch (processedImage.hdr.datatypeCode) {
      case processedImage.DT_UNSIGNED_CHAR:
        processedImage.img = new Uint8Array(array);
        break;
      case processedImage.DT_SIGNED_SHORT:
        processedImage.img = new Int16Array(array);
        break;
      case processedImage.DT_FLOAT:
        processedImage.img = new Float32Array(array);
        break;
      case processedImage.DT_DOUBLE:
        throw "datatype " + processedImage.hdr.datatypeCode + " not supported";
      case processedImage.DT_RGB:
        processedImage.img = new Uint8Array(array);
        break;
      case processedImage.DT_UINT16:
        processedImage.img = new Uint16Array(array);
        break;
      case processedImage.DT_RGBA32:
        processedImage.img = new Uint8Array(array);
        break;
      default:
        throw "datatype " + processedImage.hdr.datatypeCode + " not supported";
    }
  } else {
    processedImage.hdr.datatypeCode = processedImage.DT_FLOAT;
    processedImage.img = array;
  }
  processedImage.trustCalMinMax = false;
  processedImage.calMinMax();
  processedImage.dims = modelOutput.dims;
  console.log("processed image", processedImage);
  console.log(
    processedImage.img.reduce(
      (partialSum: number, a: number) => partialSum + a,
      0,
    ),
  );
  return processedImage;
}

export function nvPostSam(nv: any, id: any, name: any, array: Float32Array) {
  let processedImage = setImage(nv, id, name, array, false);
  nv.loadDrawing(processedImage);
  nv.setDrawColormap("$slicer3d");
  // nv.addVolume(processedImage);
  // setLayers([...nv.volumes]);

  console.log("image processed");
}

export function nvNiimathPostProcess(
  nv: any,
  id: any,
  name: any,
  array: Float32Array,
  setLayers: (layers: any) => void,
) {
  let processedImage = setImage(nv, id, name, array, true);
  // nv.loadDrawing(processedImage);
  // nv.setDrawColormap("$slicer3d");
  nv.addVolume(processedImage);
  setLayers([...nv.volumes]);

  console.log("image processed");
}
