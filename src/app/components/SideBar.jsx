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
import BrushIcon from '@mui/icons-material/Brush';
import { Toolbar } from '@mui/material';

export default function SideBar(props) {
  const nv = props.nv;

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

  return (
    <Toolbar
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
    </Toolbar>
  );
}
