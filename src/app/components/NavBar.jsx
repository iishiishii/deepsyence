/* eslint-disable react/jsx-key*/

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import View from "./View";
import { NumberPicker } from "./NumberPicker";
import Annotation from "./Annotation";
import { Box, Link } from "@mui/material";
import ArrowRight from "@mui/icons-material/ArrowRight";
import { Dropdown, DropdownMenuItem, DropdownNestedMenuItem } from "./Dropdown";
import NestedMenuItem from "./NestedMenuItem";
import NVTick from "./Tick";

export default function NavBar(props) {
  const nv = props.nv;
  const colorMaps = props.colorMaps || [];
  const [color, setColor] = React.useState("Gray");
  const [decimalPrecision, setDecimalPrecision] = React.useState(2);
  const [multiplanarPadPixels, setMultiplanarPadPixels] = React.useState(
    nv.opts.multiplanarPadPixels,
  );
  const [sliceType, setSliceType] = React.useState("multi");

  const [radiological, setRadiological] = React.useState(false);
  const [crosshair3D, setCrosshair3D] = React.useState(false);
  const [colorBar, setColorBar] = React.useState(nv.opts.isColorbar);
  const [clipPlane, setClipPlane] = React.useState(
    nv.currentClipPlaneIndex > 0 ? true : false,
  );

  function nvUpdateCrosshair3D() {
    nv.opts.show3Dcrosshair = !crosshair3D;
    nv.updateGLVolume();
    setCrosshair3D(!crosshair3D);
  }

  function nvUpdateRadiological() {
    nv.setRadiologicalConvention(!radiological);
    setRadiological(!radiological);
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
  function handleSliceTypeChange(e) {
    let newSliceType = e;
    console.log(newSliceType);
    let nvUpdateSliceType = props.onSetSliceType;
    setSliceType(newSliceType);
    nvUpdateSliceType(newSliceType);
  }
  function updateDecimalPrecision(v) {
    setDecimalPrecision(v);
  }

  function nvUpdateMultiplanarPadPixels(v) {
    nv.opts.multiplanarPadPixels = v;
    setMultiplanarPadPixels(v);
    nv.drawScene();
  }

  let allColors = colorMaps.map((colorName) => {
    return (
      <MenuItem value={colorName} key={colorName}>
        {colorName}
      </MenuItem>
    );
  });
  console.log(props.colorMaps);

  function handleColorChange(event) {
    let clr = event;

    for (let i = 0; i < nv.volumes.length; i++) {
      let id = nv.volumes[i].id;
      console.log("id, clr ", id, clr);
      props.onColorMapChange(id, clr);
    }

    setColor(clr);
  }

  function handleAddLayer() {
    let input = document.createElement("input");
    input.type = "file";
    input.multiple = true;

    input.onchange = async function () {
      for (var i = 0; i < input.files.length; i++) {
        props.onAddLayer(input.files[i]);
      }
    };

    input.click();
  }

  return (
    <div>
      <Box sx={{ width: "100vh", height: "36px" }}>
        <Dropdown
          trigger={<Button>File</Button>}
          menu={[
            <DropdownMenuItem onClick={handleAddLayer}>
              {"Upload File"}
            </DropdownMenuItem>,
            <DropdownMenuItem
              onClick={() => {
                console.log("clicked");
              }}
            >
              {"Download File"}
            </DropdownMenuItem>,
          ]}
        />
        <Dropdown
          trigger={<Button>View</Button>}
          menu={[
            <DropdownMenuItem
              onClick={() => {
                console.log("clicked");
              }}
            >
              <NVTick
                checked={clipPlane}
                title={"Clip plane"}
                onChange={nvUpdateClipPlane}
                color="companyRed"
              ></NVTick>
            </DropdownMenuItem>,
            <DropdownMenuItem
              onClick={() => {
                console.log("clicked");
              }}
            >
              <NVTick
                checked={radiological}
                title={"radiological"}
                onChange={nvUpdateRadiological}
              ></NVTick>
            </DropdownMenuItem>,
            <DropdownMenuItem
              onClick={() => {
                console.log("clicked");
              }}
            >
              <NVTick
                checked={crosshair3D}
                title={"3D crosshair"}
                onChange={nvUpdateCrosshair3D}
              ></NVTick>
            </DropdownMenuItem>,
            <DropdownMenuItem
              onClick={() => {
                console.log("clicked");
              }}
            >
              <NVTick
                checked={colorBar}
                title={"Show color bar"}
                onChange={nvUpdateColorBar}
              ></NVTick>
            </DropdownMenuItem>,
            <DropdownNestedMenuItem
              label="Display Mode"
              rightIcon={<ArrowRight />}
              menu={[
                <DropdownMenuItem
                  selected={sliceType == "axial"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSliceTypeChange("axial");
                  }}
                >
                  Axial
                </DropdownMenuItem>,
                <DropdownMenuItem
                  selected={sliceType == "coronal"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSliceTypeChange("coronal");
                  }}
                >
                  Coronal
                </DropdownMenuItem>,
                <DropdownMenuItem
                  selected={sliceType == "sagittal"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSliceTypeChange("sagittal");
                  }}
                >
                  Sagittal
                </DropdownMenuItem>,
                <DropdownMenuItem
                  selected={sliceType == "multi"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSliceTypeChange("multi");
                  }}
                >
                  Multi
                </DropdownMenuItem>,
                <DropdownMenuItem
                  selected={sliceType == "3d"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSliceTypeChange("3d");
                  }}
                >
                  3D
                </DropdownMenuItem>,
              ]}
            />,
            <DropdownNestedMenuItem
              label="Colormap"
              rightIcon={<ArrowRight />}
              menu={[
                <DropdownMenuItem
                  selected={color == "blue2red"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleColorChange("blue2red");
                  }}
                >
                  Blue2red
                </DropdownMenuItem>,
                <DropdownMenuItem
                  selected={color == "gray"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleColorChange("gray");
                  }}
                >
                  Gray
                </DropdownMenuItem>,
                <DropdownMenuItem
                  selected={color == "freesurfer"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleColorChange("freesurfer");
                  }}
                >
                  Freesurfer
                </DropdownMenuItem>,
              ]}
            />,
          ]}
        />
      </Box>
    </div>
  );
}
