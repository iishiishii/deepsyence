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
import { nv3dModelPostProcess, nvPostSam, updateSliceType } from "./helpers/niivueHandler";

// Define image, embedding and model paths
// const IMAGE_PATH = "/assets/data/dogs.jpg";
const IMAGE_EMBEDDING = new URL("./model/head.npy", document.baseURI).href;
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

  nv.onImageLoaded = () => {
    setLayers([...nv.volumes]);
  };

  console.log(`layer name ${nv.volumes.length}`);

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
    updateSliceType(nv, newSliceType);
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
    nv.setOpacity(nv.getVolumeIndexByID(id), opacity);
    nv.updateGLVolume();
  }

  function nvModel(id, name, array) {
    nvPostSam(nv, id, name, array);
  }

  function nvPreprocess(id, name, array) {
    nv3dModelPostProcess(nv, id, name, array, setLayers)
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
