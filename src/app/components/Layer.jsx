import { Box, Divider, MenuItem } from "@mui/material";
import { Typography } from "@mui/material";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { ListItemIcon } from "@mui/material";
import { Select } from "@mui/material";
import { InputLabel } from "@mui/material";
import { FormControl } from "@mui/material";
import { Paper } from "@mui/material";
import { IconButton } from "@mui/material";
import PlayCircleFilledWhiteIcon from "@mui/icons-material/PlayCircleFilledWhite";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import DeleteIcon from "@mui/icons-material/Delete";
import React from "react";
import * as ort from "onnxruntime-web";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useMemo, useRef, useState } from "react";
import Checkbox from "@mui/material/Checkbox";

export default function Layer(props) {
  const image = props.image;
  // const [processedImage, setImage] = React.useState(image.img)
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [visibilityIcon, setVisibilityIcon] = React.useState(true);
  const [opacity, setOpacity] = React.useState(image.opacity);
  const [selected, setSelected] = React.useState(false);

  let Visibility = visibilityIcon ? <VisibilityIcon /> : <VisibilityOffIcon />;
  let ArrowIcon = detailsOpen ? (
    <KeyboardArrowUpIcon />
  ) : (
    <KeyboardArrowDownIcon />
  );
  let SelectIcon = selected ? <Checkbox checked /> : <Checkbox />;

  function handleSelect() {
    setSelected(!selected);
    props.onSelect(image);
  }

  const counter = useMemo(
    () => new Worker(new URL("../worker.js", import.meta.url)),
    [],
  );

  useEffect(() => {
    if (window.Worker) {
      nvMath();
    }
  }, [counter]);

  function colToRow(colArray) {
    let dims = image.dimsRAS;
    // let colArray = image.img
    let rowArray = new Float32Array(dims[1] * dims[2] * dims[3]);
    console.log(dims);
    for (var i = 0; i < dims[1]; i++) {
      for (var j = 0; j < dims[2]; j++) {
        for (var k = 0; k < dims[3]; k++) {
          let indexCol = i + j * dims[1] + k * dims[1] * dims[2];
          let indexRow = i * dims[2] * dims[3] + j * dims[3] + k;
          rowArray[indexRow] = colArray[indexCol];
        }
      }
    }
    return rowArray;
  }

  function rowToCol(rowArray) {
    let dims = image.dimsRAS;
    // let colArray = image.img
    let colArray = new Float32Array(dims[1] * dims[2] * dims[3]);
    console.log(dims);
    for (var i = 0; i < dims[1]; i++) {
      for (var j = 0; j < dims[2]; j++) {
        for (var k = 0; k < dims[3]; k++) {
          let indexCol = i + j * dims[1] + k * dims[1] * dims[2];
          let indexRow = i * dims[2] * dims[3] + j * dims[3] + k;
          colArray[indexCol] = rowArray[indexRow];
        }
      }
    }
    return colArray;
  }

  const onnxFunct = async () => {
    try {
      let id = image.id;
      let name = image.name;

      ort.env.wasm.wasmPaths = new URL("./js/", document.baseURI).href;

      console.log(ort.env.wasm.wasmPaths);
      // @ts-ignore

      let model_url = new URL("./model/model_dynamic.onnx", document.baseURI)
        .href;
      console.log(model_url);

      let session = await ort.InferenceSession.create(model_url, {
        executionProviders: ["wasm"],
      });

      const float32Data = colToRow(image.img);
      console.log(image.dims.slice(1).concat([1]));
      console.log(
        `${float32Data.reduce((partialSum, a) => partialSum + a, 0)}`,
      );
      const inputTensor = new ort.Tensor(
        "float32",
        float32Data,
        image.dims.slice(1).concat([1]),
      );

      // prepare feeds. use model input names as keys
      //const feeds = { a: tensorA, b: tensorB }
      var feeds = { input_2: inputTensor };

      // feed inputs and run
      var results = await session.run(feeds, ["conv2d_transpose_9"]);

      // read from results
      const newImage = results["conv2d_transpose_9"].data;
      console.log(newImage);
      console.log(
        `data of result tensor 'c': ${newImage.reduce(
          (partialSum, a) => partialSum + a,
          0,
        )}`,
      );
      const rasImage = rowToCol(newImage);
      props.onSetProcess(id, name, rasImage);
    } catch (e) {
      console.log(`failed to inference ONNX model: ${e}. `);
    }
  };

  function handleDetails() {
    setDetailsOpen(!detailsOpen);
  }

  function handleDelete() {
    props.onRemoveLayer(image);
  }

  function handleOpacity() {
    let idx = image.id;
    let currentOpacity = opacity;
    console.log(currentOpacity);
    const newOpacity = currentOpacity > 0 ? 0 : 1;
    props.onSetOpacity(idx, newOpacity);
    setOpacity(newOpacity);
  }

  function visibilityToggle() {
    setVisibilityIcon(!visibilityIcon);
  }

  function processImage() {
    const imageIndex = image.id;
    let image = image.img.clone();
    // let image = nv.volumes[nv.getVolumeIndexByID(id)].clone();

    let metadata = image.getImageMetadata();
    const isNewLayer = true;
    // const input = document.getElementById('command');
    const cmd = "round";
    counter.postMessage([metadata, image.img.buffer, cmd, isNewLayer]);
  }

  const nvMath = async () => {
    // let newImage = await initWasm();
    counter.onmessage = (e) => {
      // find our processed image
      // const id = e.data.id;
      let processedImage = image.img;
      if (!processedImage) {
        console.log("image not found");
        return;
      }

      const isNewLayer = true;
      if (isNewLayer) {
        processedImage = processedImage.clone();
        processedImage.id = uuidv4();
      }

      let imageBytes = e.data.imageBytes;

      switch (processedImage.hdr.datatypeCode) {
        case processedImage.DT_UNSIGNED_CHAR:
          processedImage.img = new Uint8Array(imageBytes);
          break;
        case processedImage.DT_SIGNED_SHORT:
          processedImage.img = new Int16Array(imageBytes);
          break;
        case processedImage.DT_FLOAT:
          processedImage.img = new Float32Array(imageBytes);
          break;
        case processedImage.DT_DOUBLE:
          throw (
            "datatype " + processedImage.hdr.datatypeCode + " not supported"
          );
        case processedImage.DT_RGB:
          processedImage.img = new Uint8Array(imageBytes);
          break;
        case processedImage.DT_UINT16:
          processedImage.img = new Uint16Array(imageBytes);
          break;
        case processedImage.DT_RGBA32:
          processedImage.img = new Uint8Array(imageBytes);
          break;
        default:
          throw (
            "datatype " + processedImage.hdr.datatypeCode + " not supported"
          );
      }

      // recalculate
      processedImage.trustCalMinMax = false;
      processedImage.calMinMax();
      let imageIndex = image.id + 1;

      props.onSetProcess(imageIndex, processedImage);

      console.log("image processed");
    };
    // processImage(counter);
    // let imageIndex = nv.volumes.length;
  };

  return (
    <Paper
      elevation={20}
      sx={{
        m: 1,
      }}
    >
      <Box
        sx={{
          margin: 1,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          height: 20,
        }}
      >
        <ListItemIcon
          onClick={(e) => {
            e.stopPropagation();
            visibilityToggle(image);
            handleOpacity(image.opacity);
          }}
        >
          {Visibility}
        </ListItemIcon>
        <Typography
          sx={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {image.name}
        </Typography>
        <IconButton onClick={handleDetails} style={{ marginRight: "auto" }}>
          {ArrowIcon}
        </IconButton>
        <IconButton onClick={handleSelect} style={{ marginRight: "auto" }}>
          {SelectIcon}
        </IconButton>
      </Box>
      <Box
        sx={{
          display: detailsOpen ? "flex" : "none",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "left",
            width: "100%",
          }}
          m={1}
        >
          <IconButton onClick={onnxFunct}>
            <PlayCircleFilledWhiteIcon />
          </IconButton>
          <IconButton onClick={nvMath}>NiiMath</IconButton>
          <IconButton onClick={handleDelete}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
}
