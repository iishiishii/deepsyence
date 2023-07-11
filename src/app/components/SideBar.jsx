import React from "react";
import { Box, Menu, Typography } from "@mui/material";
import { IconButton } from "@mui/material";
import { FormControl } from "@mui/material";
import { Select } from "@mui/material";
import { MenuItem } from "@mui/material";
import { InputLabel } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import MenuIcon from "@mui/icons-material/Menu";
import LayersIcon from "@mui/icons-material/Layers";
import NVSwitch from "./Switch";
import { SettingsPanel } from "./SettingsPanel";
import { ColorPicker } from "./ColorPicker";
import { NumberPicker } from "./NumberPicker";

export default function NavBar(props) {
  const nv = props.nv;

  const [sliceType, setSliceType] = React.useState("multi");

  function handleSliceTypeChange(e) {
    let newSliceType = e.target.value;
    let nvUpdateSliceType = props.nvUpdateSliceType;
    setSliceType(newSliceType);
    nvUpdateSliceType(newSliceType);
  }
  const [radiological, setRadiological] = React.useState(false);
  const [crosshair3D, setCrosshair3D] = React.useState(false);
  const [colorBar, setColorBar] = React.useState(nv.opts.isColorbar);
  const [clipPlane, setClipPlane] = React.useState(
    nv.currentClipPlaneIndex > 0 ? true : false,
  );
  const [decimalPrecision, setDecimalPrecision] = React.useState(2);
  const [multiplanarPadPixels, setMultiplanarPadPixels] = React.useState(
    nv.opts.multiplanarPadPixels,
  );
  const [penMode, setPenMode] = React.useState(-1);
  const modeValueMaps = [-1, 0, 1, 2, 3, 8, 9, 10, 11, 12];
  const modeNameMaps = [
    "Off",
    "Erase",
    "Red",
    "Green",
    "Blue",
    "Filled Erase",
    "Filled Red",
    "Filled Green",
    "Filled Blue",
    "Erase Cluster",
  ];
  let allModes = modeValueMaps.map((modeValue, id) => {
    return (
      <MenuItem value={modeValue} key={modeNameMaps[id]}>
        {modeNameMaps[id]}
      </MenuItem>
    );
  });

  // write a function to handle the pen drawing
  //   document.getElementById("drawPen").addEventListener("change", doDrawPen);
  function doDrawPen(event) {
    console.log(event.target.value);
    const mode = parseInt(event.target.value);
    nv.setDrawingEnabled(mode >= 0);
    if (mode >= 0) nv.setPenValue(mode & 7, mode > 7);
    if (mode === 12)
      //erase selected cluster
      nv.setPenValue(-0);
    setPenMode(mode);
  }

  function updateDecimalPrecision(v) {
    setDecimalPrecision(v);
  }

  function nvUpdateCrosshair3D() {
    nv.opts.show3Dcrosshair = !crosshair3D;
    nv.updateGLVolume();
    setCrosshair3D(!crosshair3D);
  }

  function nvUpdateRadiological() {
    nv.setRadiologicalConvention(!radiological);
    setRadiological(!radiological);
  }

  function nvUpdateMultiplanarPadPixels(v) {
    nv.opts.multiplanarPadPixels = v;
    setMultiplanarPadPixels(v);
    nv.drawScene();
  }

  function nvUpdateClipPlane() {
    if (!clipPlane) {
      setClipPlane(true);
      nv.setClipPlane([0, 270, 0]); //left
    } else {
      setClipPlane(false);
      nv.setClipPlane([2, 0, 0]); //none
    }
  }

  function nvUpdateColorBar() {
    setColorBar(!colorBar);
    nv.opts.isColorbar = !colorBar;
    nv.drawScene();
  }

  return (
    <Box
      sx={{
        display: "flex",
        // height: "100vh",
        width: "10%",
        flexDirection: "column",
        justifyItems: "left",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <SettingsPanel width={100}>
        <NVSwitch
          checked={clipPlane}
          title={"Clip plane"}
          onChange={nvUpdateClipPlane}
          color="companyRed"
        ></NVSwitch>
        <NVSwitch
          checked={radiological}
          title={"radiological"}
          onChange={nvUpdateRadiological}
        ></NVSwitch>
        <NVSwitch
          checked={crosshair3D}
          title={"3D crosshair"}
          onChange={nvUpdateCrosshair3D}
        ></NVSwitch>
        <NVSwitch
          checked={colorBar}
          title={"Show color bar"}
          onChange={nvUpdateColorBar}
        ></NVSwitch>

        <NumberPicker
          value={decimalPrecision}
          onChange={updateDecimalPrecision}
          title={"Decimal precision"}
          min={0}
          max={8}
          step={1}
        ></NumberPicker>
        <NumberPicker
          value={multiplanarPadPixels}
          onChange={nvUpdateMultiplanarPadPixels}
          title={"Multiplanar padding"}
          min={0}
          max={20}
          step={2}
        ></NumberPicker>
        <FormControl
          size="small"
          sx={{
            m: 2,
            minWidth: 120,
          }}
        >
          <InputLabel>Mode</InputLabel>
          <Select
            style={{ width: "100px" }}
            value={penMode}
            label="Pen"
            size="small"
            onChange={doDrawPen}
          >
            {allModes}
          </Select>
        </FormControl>
      </SettingsPanel>
      {props.children}
    </Box>
  );
}
