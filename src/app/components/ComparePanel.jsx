import React from "react";
import { Box } from "@mui/material";
import { Niivue } from "@niivue/niivue";
import { MaskPanel } from "./MaskPanel";
import { setImage } from "../helpers/niivueHandler";

const nv1 = new Niivue({
  loadingText: "Loading",
  dragAndDropEnabled: true,
  textHeight: "0.02",
  backColor: [0, 0, 0, 1],
  crosshairColor: [244, 243, 238, 0.5],
});

const nv2 = new Niivue({
  loadingText: "Loading",
  dragAndDropEnabled: true,
  textHeight: "0.02",
  backColor: [0, 0, 0, 1],
  crosshairColor: [244, 243, 238, 0.5],
});

// The NiiVue component wraps all other components in the UI.
// It is exported so that it can be used in other projects easily
export default function ComparePanel({ url1, url2 }) {
  React.useEffect(() => {
    if (url1 !== undefined && url2 !== undefined) {
      nv1.removeVolumeByUrl(url1);
      nv2.removeVolumeByUrl(url2);
    }
    // eslint-disable-next-line
  }, []);

  nv1.onImageLoaded = () => {
    nv1.isLoaded = true;
    syncImages();
  };

  nv2.onImageLoaded = () => {
    nv2.isLoaded = true;
    syncImages();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        justifyContent: "space-around",
      }}
    >
      <div style={{ width: "50%" }}>
        <MaskPanel nv={nv1}></MaskPanel>
      </div>
      <div style={{ width: "50%" }}>
        <MaskPanel nv={nv2}></MaskPanel>
      </div>
    </Box>
  );
}
