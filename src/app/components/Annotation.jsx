import React from "react";
import { Select } from "@mui/material";
import { MenuItem } from "@mui/material";
import BrushIcon from "@mui/icons-material/Brush";

export default function Annotation(props) {
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
    <div>
      <Select
        // style={{ width: "90px"}}
        value={penMode}
        // label="Pen"
        size="small"
        onChange={doDrawPen}
        MenuProps={{
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "left",
          },
        }}
        IconComponent={BrushIcon}
      >
        {allModes}
      </Select>
    </div>
  );
}
