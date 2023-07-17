import React from "react";
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

const theme = createTheme({
  palette: {
    primary: {
      main: "#496A81",
    },
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

// The NiiVue component wraps all other components in the UI.
// It is exported so that it can be used in other projects easily
export default function NiiVue(props) {
  const [openLayers, setOpenLayers] = React.useState(false);
  const [layers, setLayers] = React.useState(nv.volumes);

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
        colorMaps={nv.colormaps() || []}
        onColorMapChange={nvUpdateColorMap}
        onRemoveLayer={nvRemoveLayer}
        onSetOpacity={nvUpdateOpacity}
        onSetProcess={nvProcess}
      />
    );
  });

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

  function nvProcess(id, name, array) {
    // find our processed image
    console.log(array.reduce((partialSum, a) => partialSum + a, 0));

    let modelOutput = nv.volumes[nv.getVolumeIndexByID(id)];

    if (!modelOutput) {
      console.log("image not found");
      return;
    }

    let processedImage = modelOutput.clone();
    processedImage.id = uuidv4();
    processedImage.name = name.split(".")[0] + "_processed.nii.gz";

    processedImage.hdr.datatypeCode = processedImage.DT_FLOAT;
    processedImage.img = array;

    processedImage.trustCalMinMax = false;
    processedImage.calMinMax();
    console.log(
      processedImage.img.reduce((partialSum, a) => partialSum + a, 0),
    );
    nv.addVolume(processedImage);
    setLayers([...nv.volumes]);

    console.log("image processed");
  }

  return (
    <ThemeProvider theme={theme}>
      <Grid container direction={"row"}>
        <NavBar nv={nv}></NavBar>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            height: `calc(100vh - 64px)`,
            backgroundColor: "black",
            marginTop: "auto",
          }}
        >
          <NiivuePanel nv={nv} volumes={layers}></NiivuePanel>
          <Box
            sx={{
              width: "25%",
              display: "flex",
              flexDirection: "row",
            }}
          >
            <LayersPanel
              open={openLayers}
              onToggleMenu={toggleLayers}
              onAddLayer={addLayer}
              onSetSliceType={nvUpdateSliceType}
            >
              {layerList}
            </LayersPanel>
          </Box>
        </Box>
      </Grid>
    </ThemeProvider>
  );
}
