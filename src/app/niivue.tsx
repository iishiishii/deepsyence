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
import { viewType } from "./types";
/* @ts-ignore */
import npyjs from "npyjs";
import * as ort from "onnxruntime-web";
import {
  nvNiimathPostProcess,
  nvPostSam,
  updateSliceType,
} from "./helpers/niivueHandler";

const theme = createTheme({
  palette: {
    primary: {
      main: "#496A81",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#496A81",
    },
  },
});

const nv = new Niivue({
  loadingText: 'Drag-drop images or Click "+" button',
  dragAndDropEnabled: true,
  textHeight: "0.02",
  backColor: [0, 0, 0, 1],
  crosshairColor: [244, 243, 238, 0.5],
  multiplanarForceRender: false,
  onLocationChange: handleIntensityChange,
});

function handleIntensityChange(data: any) {
  document.getElementById("intensity")!.innerHTML =
    "&nbsp;&nbsp;" + data.string;
}

// let instance = new WorkerBuilder(Worker);

export default function NiiVue(props: any) {
  const [openLayers, setOpenLayers] = useState(false);
  const [layers, setLayers] = useState(nv.volumes);
  const [selectedLayer, setSelectedLayer] = useState([]);

  nv.onImageLoaded = () => {
    setLayers([...nv.volumes]);
  };
  console.log(`layer name ${nv.volumes.length}`);

  const layerList = layers.map((layer: any) => {
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

  function nvSelect(layer: any) {
    if (layer) {
      setSelectedLayer(layer);
    }
  }

  async function addLayer(file: File) {
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

  function nvUpdateSliceType(newSliceType: viewType) {
    updateSliceType(nv, newSliceType);
  }

  function nvUpdateColorMap(id: string, clr: string) {
    nv.setColormap(id, clr);
    nv.updateGLVolume();
  }

  function nvRemoveLayer(imageToRemove: any) {
    nv.removeVolume(imageToRemove);
    setLayers([...nv.volumes]);
  }

  function nvUpdateOpacity(id: string, opacity: number) {
    nv.setOpacity(nv.getVolumeIndexByID(id), opacity);
    nv.updateGLVolume();
  }

  function nvModel(id: any, name: any, array: Float32Array) {
    nvPostSam(nv, id, name, array);
  }

  function nvPreprocess(id: any, name: any, array: Float32Array) {
    nvNiimathPostProcess(nv, id, name, array, setLayers);
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
