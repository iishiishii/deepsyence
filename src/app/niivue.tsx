import { useContext, useEffect, useState } from "react";
import AppContext from "./hooks/createContext";
import { Box } from "@mui/material";
import { Grid } from "@mui/material";
import { Niivue, NVImage } from "@niivue/niivue";
import NavBar from "./components/NavBar";
import { LayersPanel } from "./components/LayersPanel";
import { NiivuePanel } from "./components/NiivuePanel";
import Layer from "./components/Layer";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Popover from "@mui/material/Popover";
import Typography from '@mui/material/Typography';
import { ViewType } from "./types";
/* @ts-ignore */
import {
  nvNiimathPostProcess,
  nvPostSam,
  updateSliceType,
} from "./helpers/niivueHandler";
import { handleJobNotification } from "./components/Alert";

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
  components: {
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "#496A81",
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          color: "#496A81",
        },
      },
    },
  },
});

function handleIntensityChange(data: any) {
  document.getElementById("intensity")!.innerHTML =
    data.vox[0] + "×" + data.vox[1] + "×" + data.vox[2];
}

const nv = new Niivue({
  loadingText: "Drag-drop images or Click File then Upload File",
  dragAndDropEnabled: true,
  textHeight: "0.02",
  backColor: [0, 0, 0, 1],
  crosshairColor: [244, 243, 238, 0.5],
  multiplanarForceRender: false,
  onLocationChange: handleIntensityChange,
});

export default function NiiVue(props: any) {
  const [openLayers, setOpenLayers] = useState(false);
  const [layers, setLayers] = useState(nv.volumes);
  const [selectedLayer, setSelectedLayer] = useState([]);
  const {
    modelLoading: [loading],
  } = useContext(AppContext)!;

  useEffect(() => {
    nv.addVolumeFromUrl({
      url: new URL("./model/sub-M2002_ses-a1440_T2w.nii", document.baseURI)
        .href,
    }).then(() => {
      nv.addVolumeFromUrl({
        url: new URL("./model/lesion_mask.nii", document.baseURI).href,
        colormap: "bluegrn",
        opacity: 0,
      });
    });
  }, []);

  nv.onImageLoaded = () => {
    setLayers([...nv.volumes]);
  };

  function nvSelect(layer: any) {
    if (layer) {
      setSelectedLayer(layer);
    }
  }

  async function addLayer(file: File) {
    try {
      const nvimage = await NVImage.loadFromFile({
        file: file,
      });
      console.log(`file imported ${file}`);

      nv.addVolume(nvimage);
      setLayers([...nv.volumes]);
    } catch (err) {
      handleJobNotification(err!.toString());
      console.log("add layer", err);
    }
  }

  function toggleLayers() {
    setOpenLayers(!openLayers);
  }

  function nvUpdateSliceType(newSliceType: ViewType) {
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

  function nvModel(id: any, name: any, array: Uint8Array) {
    nvPostSam(nv, id, name, array);
  }

  function nvPreprocess(id: any, name: any, array: Float32Array) {
    nvNiimathPostProcess(nv, id, name, array, setLayers);
  }

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
        onAlert={handleJobNotification}
      />
    );
  });

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
          <Popover open={loading} className="loader" marginThreshold={0} classes={{ paper: "MuiPopover-paper" }}>
          <Typography variant="h1" component="h2" mt="40%" align="center" alignSelf="center">Loading model</Typography>
          </Popover>
          <NiivuePanel nv={nv} volumes={layers}></NiivuePanel>
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
