import { FormControl } from "@mui/material";
import { Box } from "@mui/material";
import { InputLabel, MenuItem } from "@mui/material";
import { Select } from "@mui/material";
import { Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GestureIcon from "@mui/icons-material/Gesture";
import LayersIcon from "@mui/icons-material/Layers";
import AddIcon from "@mui/icons-material/Add";
import React from "react";
import { styled } from "@mui/material/styles";
import { outlinedInputClasses } from "@mui/material/OutlinedInput";
import shadows from "@mui/material/styles/shadows";

export function LayersPanel(props) {
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

  const [sliceType, setSliceType] = React.useState("multi");

  function handleSliceTypeChange(e) {
    let newSliceType = e.target.value;
    let nvUpdateSliceType = props.onSetSliceType;
    setSliceType(newSliceType);
    nvUpdateSliceType(newSliceType);
  }

  const StyledSelect = styled(Select)(`
  & .${outlinedInputClasses.notchedOutline} {
    border-color: orange;
  }
  &:hover .${outlinedInputClasses.notchedOutline} {
    border-color: white;
  }
  &.${outlinedInputClasses.focused} .${outlinedInputClasses.notchedOutline} {
    border-color: orange;
  }
`);

  return (
    <Box
      sx={{
        width: 500,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        // overflowY: "scroll",
        m: 1,
        borderRadius: 1,
        border: "1px solid grey",
        boxShadow: "3px white inset",
        // backgroundColor: "#468189",
        // opacity: [0.9, 0.8, 0.8],
      }}
    >
      <Box
        sx={{
          height: 48,
          display: "flex",
          flexDirection: "row",
          // backgroundColor: '#F8F8F8',
          m: 1,
          alignItems: "center",
        }}
      >
        <Button onClick={handleAddLayer} endIcon={<AddIcon />} size="large">
          {/* Add Layer */}
        </Button>
        <FormControl
          size="small"
          variant="outlined"
          sx={{
            m: 2,
            width: 150,
          }}
        >
          <InputLabel
            id="slice-type-label"
            disableAnimation={true}
            sx={{
              color: "primary.main",
            }}
          >
            Display mode
          </InputLabel>
          <StyledSelect
            labelId="slice-type-label"
            id="slice-type"
            value={sliceType}
            label="Display mode"
            sx={{
              color: "primary.main",
            }}
            onChange={handleSliceTypeChange}
          >
            <MenuItem value={"axial"}>Axial</MenuItem>
            <MenuItem value={"coronal"}>Coronal</MenuItem>
            <MenuItem value={"sagittal"}>Sagittal</MenuItem>
            <MenuItem value={"multi"}>Multi</MenuItem>
            <MenuItem value={"3d"}>3D</MenuItem>
          </StyledSelect>
        </FormControl>
      </Box>

      <Box
        sx={{
          width: props.width,
          role: "presentation",
          display: "flex",
          height: "100%",
          flexDirection: "column",
          justifyContent: "flex-start",
          // ml: 1,
          // mr: 1,
        }}
      >
        {props.children}
      </Box>
    </Box>
  );
}
