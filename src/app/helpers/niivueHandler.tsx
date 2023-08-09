import { viewType } from "../types";
import { v4 as uuid } from 'uuid';

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

export function nvPostSam(nv: any, id: any, name: any, array: Float32Array) {
    let modelOutput = nv.volumes[nv.getVolumeIndexByID(id)];
    console.log("processed image ",
      modelOutput.img.reduce((partialSum: number, a: number) => partialSum + a, 0),
    );
    if (!modelOutput) {
      console.log("image not found");
      return;
    }
    console.log("model output ", modelOutput); 
    let processedImage = modelOutput.clone();
    processedImage.id = uuid();
    processedImage.name = name.split(".")[0] + "_processed.nii.gz";

    processedImage.hdr.datatypeCode = processedImage.DT_FLOAT;
    processedImage.img = array;

    processedImage.trustCalMinMax = false;
    processedImage.calMinMax();
    // processedImage.dims = modelOutput.dims;
    console.log("processed image", processedImage)
    console.log(
      processedImage.img.reduce((partialSum: number, a: number) => partialSum + a, 0),
    );
    nv.loadDrawing(processedImage);
    nv.setDrawColormap("$slicer3d");
    // nv.addVolume(processedImage);
    // setLayers([...nv.volumes]);

    console.log("image processed");
  }

export function nv3dModelPostProcess(nv: any, id: any, name: any, array: Float32Array, setLayers: (layers: any) => void) {
    // find our processed image
    // console.log("output ", array.reduce((partialSum, a) => partialSum + a, 0));

    let modelOutput = nv.volumes[nv.getVolumeIndexByID(id)];
    console.log("processed image ",
      modelOutput.img.reduce((partialSum: number, a: number) => partialSum + a, 0),
    );
    if (!modelOutput) {
      console.log("image not found");
      return;
    }
    console.log("model output ", modelOutput); 
    let processedImage = modelOutput.clone();
    processedImage.id = uuid();
    processedImage.name = name.split(".")[0] + "_processed.nii.gz";
    processedImage.img = array;

    // processedImage.hdr.datatypeCode = processedImage.DT_FLOAT;
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
    
    processedImage.trustCalMinMax = false;
    processedImage.calMinMax();
    processedImage.dims = modelOutput.dims;
    console.log("processed image", processedImage)
    console.log(
      processedImage.img.reduce((partialSum: number, a: number) => partialSum + a, 0),
    );
    // nv.loadDrawing(processedImage);
    // nv.setDrawColormap("$slicer3d");
    nv.addVolume(processedImage);
    setLayers([...nv.volumes]);

    console.log("image processed");
  }