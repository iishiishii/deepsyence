import React, { useContext, useEffect, useState } from "react";
import { MenuItem, Select } from "@mui/material";
import { Box } from "@mui/material";
import { Grid } from "@mui/material";
import { Niivue, NVImage } from "@niivue/niivue";
import NavBar from "./components/NavBar";
import { LayersPanel } from "./components/LayersPanel";
import { NiivuePanel } from "./components/NiivuePanel";
import Layer from "./components/Layer";
import { v4 as uuidv4 } from "uuid";
import { createTheme, ThemeProvider } from "@mui/material/styles";
// import WorkerBuilder from "./components/WorkerBuilder";
import { handleImageScale } from "./helpers/scaleHelper";
import { modelScaleProps } from "./helpers/Interfaces";
import { onnxMaskToImage } from "./helpers/maskUtils";
import { modelData } from "./helpers/onnxModelAPI";
import AppContext from "./hooks/createContext";
import { InferenceSession, Tensor } from "onnxruntime-web";
/* @ts-ignore */
import npyjs from "npyjs";
import * as ort from "onnxruntime-web";

// Define image, embedding and model paths
// const IMAGE_PATH = "/assets/data/dogs.jpg";
const IMAGE_EMBEDDING = new URL("./head.npy", document.baseURI).href;
const MODEL_DIR = new URL("./model/sam_onnx_quantized_example.onnx", document.baseURI).href;

const theme = createTheme({
  palette: {
    primary: {
      main: "#496A81",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#496A81",
    }
  },
});

const nv = new Niivue({
  loadingText: 'Drag-drop images or Click "+" button',
  dragAndDropEnabled: true,
  textHeight: "0.02",
  backColor: [0, 0, 0, 1],
  crosshairColor: [244, 243, 238, 0.5],
  onLocationChange: handleIntensityChange,
});

function handleIntensityChange(data) {
  document.getElementById("intensity").innerHTML = "&nbsp;&nbsp;" + data.string;
}

// let instance = new WorkerBuilder(Worker);

// The NiiVue component wraps all other components in the UI.
// It is exported so that it can be used in other projects easily
export default function NiiVue(props) {
  const [openLayers, setOpenLayers] = useState(false);
  const [layers, setLayers] = useState(nv.volumes);
  const [selectedLayer, setSelectedLayer] = [] || useState(nv.volumes[0]);
  const {
    clicks: [clicks],
    image: [, setImage],
    maskImg: [, setMaskImg],
  } = useContext(AppContext);
  const [model, setModel] = useState(null); // ONNX model
  const [tensor, setTensor] = useState(null); // Image embedding tensor

  // The ONNX model expects the input to be rescaled to 1024. 
  // The modelScale state variable keeps track of the scale values.
  const [modelScale, setModelScale] = useState(null);

  // Initialize the ONNX model. load the image, and load the SAM
  // pre-computed image embedding
  useEffect(() => {
    // Initialize the ONNX model
    const initModel = async () => {
      try {
        if (MODEL_DIR === undefined) return;
        ort.env.wasm.wasmPaths = new URL("./js/", document.baseURI).href;
        const MODEL_URL = MODEL_DIR;
        const model = await InferenceSession.create(MODEL_URL, {
          executionProviders: ["wasm"],
        });
        setModel(model);
      } catch (e) {
        console.log(e);
      }
    };
    initModel();

    // Load the image
    // const url = new URL(IMAGE_PATH, location.origin);
    // loadImage(url);

    // Load the Segment Anything pre-computed embedding
    Promise.resolve(loadNpyTensor(IMAGE_EMBEDDING, "float32")).then(
      (embedding) => setTensor(embedding)
    );
  }, []);

  // Decode a Numpy file into a tensor. 
  const loadNpyTensor = async (tensorFile, dType) => {
    console.log(tensorFile)
    let npLoader = new npyjs();
    const npArray = await npLoader.load(tensorFile);
    const tensor = new ort.Tensor(dType, npArray.data, npArray.shape);
    return tensor;
  };

  // Run the ONNX model every time clicks has changed
  useEffect(() => {
    runONNX();
  }, [clicks]);

  const runONNX = async () => {
    try {
      if (
        model === null ||
        clicks === null ||
        tensor === null ||
        modelScale === null
      )
        return;
      else {
        // Preapre the model input in the correct format for SAM. 
        // The modelData function is from onnxModelAPI.tsx.
        const feeds = modelData({
          clicks,
          tensor,
          modelScale,
        });
        if (feeds === undefined) return;
        // Run the SAM ONNX model with the feeds returned from modelData()
        const results = await model.run(feeds);
        const output = results[model.outputNames[0]];
        // The predicted mask returned from the ONNX model is an array which is 
        // rendered as an HTML image using onnxMaskToImage() from maskUtils.tsx.
        setMaskImg(onnxMaskToImage(output.data, output.dims[2], output.dims[3]));
      }
    } catch (e) {
      console.log(e);
    }
  };

  nv.onImageLoaded = () => {
    setLayers([...nv.volumes]);
  };

  console.log(`layer name ${nv.volumes.length}`);

  nv.opts.onLocationChange = (data) => {
    setLocationData(data.values);
  };
  // construct an array of <Layer> components. Each layer is a NVImage or NVMesh
  const layerList = layers.map((layer) => {
    console.log(`layer list ${layer.name}`);
    return (
      <Layer
        key={layer.name}
        image={layer}
        onColorMapChange={nvUpdateColorMap}
        onRemoveLayer={nvRemoveLayer}
        onSetOpacity={nvUpdateOpacity}
        onPreprocess={nvPreprocess}
        onSelect={nvSelect}
        onModel={nvModel}
      />
    );
  });

  function nvSelect(layer) {
    setSelectedLayer(layer);
  }

  async function addLayer(file) {
    const nvimage = await NVImage.loadFromFile({
      file: file,
    });
    console.log(`file imported ${file}`);

    nv.addVolume(nvimage);
    setLayers([...nv.volumes]);
  }

  function toggleLayers() {
    setOpenLayers(!openLayers);
  }

  function nvUpdateSliceType(newSliceType) {
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

  function nvUpdateColorMap(id, clr) {
    nv.setColormap(id, clr);
    nv.updateGLVolume();
  }

  function nvRemoveLayer(imageToRemove) {
    nv.removeVolume(imageToRemove);
    setLayers([...nv.volumes]);
  }

  function nvUpdateOpacity(id, opacity) {
    // console.log(nv.getVolumeIndexByID(id))
    nv.setOpacity(nv.getVolumeIndexByID(id), opacity);
    nv.updateGLVolume();
  }

  function nvModel(id, name, array) {
    // find our processed image
    // console.log("output ", array.reduce((partialSum, a) => partialSum + a, 0));

    let modelOutput = nv.volumes[nv.getVolumeIndexByID(id)];
    console.log("processed image ",
      modelOutput.img.reduce((partialSum, a) => partialSum + a, 0),
    );
    if (!modelOutput) {
      console.log("image not found");
      return;
    }
    console.log("model output ", modelOutput); 
    let processedImage = modelOutput.clone();
    processedImage.id = uuidv4();
    processedImage.name = name.split(".")[0] + "_processed.nii.gz";

    processedImage.hdr.datatypeCode = processedImage.DT_FLOAT;
    processedImage.img = array;

    processedImage.trustCalMinMax = false;
    processedImage.calMinMax();
    // processedImage.dims = modelOutput.dims;
    console.log("processed image", processedImage)
    console.log(
      processedImage.img.reduce((partialSum, a) => partialSum + a, 0),
    );
    nv.loadDrawing(processedImage);
    nv.setDrawColormap("$slicer3d");
    // nv.addVolume(processedImage);
    // setLayers([...nv.volumes]);

    console.log("image processed");
  }

  function nvPreprocess(id, name, array) {
    // find our processed image
    // console.log("output ", array.reduce((partialSum, a) => partialSum + a, 0));

    let modelOutput = nv.volumes[nv.getVolumeIndexByID(id)];
    console.log("processed image ",
      modelOutput.img.reduce((partialSum, a) => partialSum + a, 0),
    );
    if (!modelOutput) {
      console.log("image not found");
      return;
    }
    console.log("model output ", modelOutput); 
    let processedImage = modelOutput.clone();
    processedImage.id = uuidv4();
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
      processedImage.img.reduce((partialSum, a) => partialSum + a, 0),
    );
    // nv.loadDrawing(processedImage);
    // nv.setDrawColormap("$slicer3d");
    nv.addVolume(processedImage);
    setLayers([...nv.volumes]);

    console.log("image processed");
  }

  return (
    <ThemeProvider theme={theme}>
      <Grid container direction={"row"}>
        <NavBar
          theme={theme}
          nv={nv}
          colorMaps={nv.colormaps() || []}
          onSetSliceType={nvUpdateSliceType}
          onColorMapChange={nvUpdateColorMap}
          onAddLayer={addLayer}
        ></NavBar>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            width: "100vw",
            height: `calc(100vh - 36px)`,
            backgroundColor: "black",
            marginTop: "auto",
          }}
        >
          <NiivuePanel nv={nv} volumes={layers}></NiivuePanel>
          {/* <Box
            sx={{
              width: "25%",
              display: "flex",
              flexDirection: "row",
            }}
          > */}
            <LayersPanel
              open={openLayers}
              onToggleMenu={toggleLayers}
              onSetSliceType={nvUpdateSliceType}
            >
              {layerList}
            </LayersPanel>
          {/* </Box> */}
        </Box>
      </Grid>
    </ThemeProvider>
  );
}
