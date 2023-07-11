import React from "react";
import { MenuItem, Select } from "@mui/material";
import { Box } from "@mui/material";
import { Grid } from "@mui/material";
import { Popper } from "@mui/material";
import { FormControl } from "@mui/material";
import { InputLabel } from "@mui/material";
import { Paper } from "@mui/material";
import { Niivue, NVImage } from "@niivue/niivue";
import NavBar from "./components/NavBar";
import SideBar from "./components/SideBar";
import { LayersPanel } from "./components/LayersPanel";
import { NiivuePanel } from "./components/NiivuePanel";
import LocationTable from "./components/LocationTable";
import Layer from "./components/Layer";
import { v4 as uuidv4 } from "uuid";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#468189",
    },
  },
});

const nv = new Niivue({
  loadingText: 'Drag-drop images or Click "+" button',
  dragAndDropEnabled: true,
  textHeight: "0.02",
  backColor: [0, 0, 0, 1],
  crosshairColor: [244, 243, 238, 0.5],
});

// The NiiVue component wraps all other components in the UI.
// It is exported so that it can be used in other projects easily
export default function NiiVue(props) {
  const [openLayers, setOpenLayers] = React.useState(false);

  const [layers, setLayers] = React.useState(nv.volumes);
  const [radiological, setRadiological] = React.useState(false);
  const [crosshair3D, setCrosshair3D] = React.useState(false);
  const [colorBar, setColorBar] = React.useState(nv.opts.isColorbar);
  const [clipPlane, setClipPlane] = React.useState(
    nv.currentClipPlaneIndex > 0 ? true : false,
  );
  // TODO: add crosshair size state and setter
  const [locationData, setLocationData] = React.useState([]);

  nv.opts.onImageLoaded = () => {
    console.log(`layer name ${nv.volumes[0]}`);
    setLayers([...nv.volumes]);
  };

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
    nv.volumes[nv.getVolumeIndexByID(id)].setColorMap(clr);
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

  function nvProcess(id, array) {
    // find our processed image
    console.log(array.reduce((partialSum, a) => partialSum + a, 0));

    let processedImage = nv.volumes[nv.getVolumeIndexByID(id)];
    // console.log(processedImage)
    if (!processedImage) {
      console.log("image not found");
      return;
    }

    console.log(
      processedImage.img.reduce((partialSum, a) => partialSum + a, 0),
    );
    processedImage = processedImage.clone();
    processedImage.id = uuidv4();
    console.log(processedImage.img.length, array.length);
    processedImage.hdr.datatypeCode = processedImage.DT_FLOAT;
    processedImage.img = array;

    console.log(
      processedImage.img.reduce((partialSum, a) => partialSum + a, 0),
    );
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
      {/* <Grid container direction={ 'column' } style={{ flexWrap: 'nowrap' }}> */}
      <Grid
        container
        direction={"column"}
        style={{ flexWrap: "nowrap" }}
        alignItems="stretch"
      >
        {/* <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          maxHeight: "100vh",
          backgroundColor: "black",
        }}
      > */}
        <NavBar></NavBar>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            // height: "100vh",
            maxHeight: "100vh",
            backgroundColor: "black",
            marginTop: "auto",
          }}
        >
          <SideBar nv={nv} nvUpdateSliceType={nvUpdateSliceType}></SideBar>

          <NiivuePanel nv={nv} volumes={layers}></NiivuePanel>
          <Box
            sx={{
              width: "30%",
              display: "flex",
              flexDirection: "row",
              // height: "20%"
            }}
          >
            <LayersPanel
              open={openLayers}
              // width={320}
              onToggleMenu={toggleLayers}
              onAddLayer={addLayer}
            >
              {layerList}
            </LayersPanel>
            {/* <LocationTable 
              tableData={locationData} 
              decimalPrecision={decimalPrecision}
            /> */}
          </Box>
        </Box>
        {/* </Box> */}
      </Grid>
      {/* </Grid> */}
    </ThemeProvider>
  );
}
