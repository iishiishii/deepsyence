import { Box} from "@mui/material";
import { Typography } from "@mui/material";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { ListItemIcon } from "@mui/material";
import { Paper } from "@mui/material";
import { IconButton } from "@mui/material";
import PlayCircleFilledWhiteIcon from "@mui/icons-material/PlayCircleFilledWhite";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import DeleteIcon from "@mui/icons-material/Delete";
import React from "react";
import * as ort from "onnxruntime-web";
import { v4 as uuidv4 } from "uuid";
import { useEffect} from "react";
import Checkbox from "@mui/material/Checkbox";
import { LinearMemory } from "@niivue/niimath-js/src/linear-memory.js";
// import WorkerBuilder from "./WorkerBuilder";
// import Worker from "../worker"

let linearMemory = new LinearMemory({ initial: 256, maximum: 2048 });
// export let wasmReady;

let niimathWasm = await (async () => {
    let module 
    try {
        const wasmPath = new URL("./process-image.wasm", document.baseURI).href;

        const response = await fetch(wasmPath);
        module = await WebAssembly.instantiateStreaming(response, { env: linearMemory.env() });
    } catch (error) {
        console.error('Error loading or instantiating WebAssembly module:', error);
    }
    return module.instance.exports;

})();



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

  // let instance = new WorkerBuilder(Worker);

  // useEffect(() => {
  //   nvMath();
  // }, []);

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
      props.onModel(id, name, rasImage);
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

    let process_image = image.clone();
    // let image = nv.volumes[nv.getVolumeIndexByID(id)].clone();
    process_image.img = new Uint8Array(process_image.img);
    process_image.hdr.datatypeCode = process_image.DT_UNSIGNED_CHAR;
    let imageMetadata = process_image.getImageMetadata();
    let imageBytes = process_image.img.buffer;

    // const input = document.getElementById('command');
    const cmd = "-round";
    // instance.postMessage([imageMetadata, process_image.img.buffer, cmd, isNewLayer]);
    console.log(imageMetadata)
    // niimathWasmPromise.then((niimathWasm) => {
      // const niimathWasm = niimathWasmPromise;
      // console.log("message", e)
      // const imageMetadata = e.data[0];
      // const imageBytes = e.data[1];
      // const cmd = e.data[2];
      // const isNewLayer = e.data[3];
  
      let cptr = niimathWasm.walloc(cmd.length + 1);
      linearMemory.record_malloc(cptr, cmd.length + 1);
      let cmdstr = new Uint8Array(cmd.length + 1);
      for (let i = 0; i < cmd.length; i++) cmdstr[i] = cmd.charCodeAt(i);
      let cstr = new Uint8Array(niimathWasm.memory.buffer, cptr, cmd.length + 1);
      cstr.set(cmdstr);
      //allocate WASM image data
      let nvox =
        imageMetadata.nx * imageMetadata.ny * imageMetadata.nz * imageMetadata.nt;
      let ptr = niimathWasm.walloc(nvox * imageMetadata.bpv);
      linearMemory.record_malloc(ptr, nvox * imageMetadata.bpv);
      let cimg = new Uint8Array(
        niimathWasm.memory.buffer,
        ptr,
        nvox * imageMetadata.bpv,
      );
      cimg.set(new Uint8Array(imageBytes));
      console.log(cimg);
      let ok = niimathWasm.niimath(
        ptr,
        imageMetadata.datatypeCode,
        imageMetadata.nx,
        imageMetadata.ny,
        imageMetadata.nz,
        imageMetadata.nt,
        imageMetadata.dx,
        imageMetadata.dy,
        imageMetadata.dz,
        imageMetadata.dt,
        cptr,
      );
  
      if (ok != 0) {
        console.error(" -> '", cmd, " generated a fatal error: ", ok);
        return;
      }
      cimg = new Uint8Array(
        niimathWasm.memory.buffer,
        ptr,
        nvox * imageMetadata.bpv,
      );
      // https://stackoverflow.com/questions/59705741/why-memory-could-not-be-cloned
      let clone = new Uint8Array(cimg, 0, nvox * imageMetadata.bpv);
      let imageIndex = image.id;
      props.onPreprocess(imageIndex, "new.nii", clone);
      //free WASM memory
      linearMemory.record_free(cptr);
      niimathWasm.wfree(cptr);
      linearMemory.record_free(ptr);
      niimathWasm.wfree(ptr);
  }


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
          <IconButton sx={{ fontSize: "13px", borderRadius: "5px" }} onClick={processImage}>NiiMath</IconButton>
          <IconButton onClick={handleDelete}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
}
