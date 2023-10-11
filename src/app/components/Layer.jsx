import { Box } from "@mui/material";
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
import * as ort from "onnxruntime-web";
import { v4 as uuidv4 } from "uuid";
import React, { useContext, useEffect, useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import npyjs from "npyjs";
import { processImage } from "../helpers/niimath";
import { brainExtractionModel } from "../helpers/brainExtractionModel";
import { samEncoder, samModel } from "../helpers/samModel";
import { resizeImageData } from "../helpers/scaleHelper";
// import nj from "numjs";
import { colToRow } from "../helpers/maskUtils"
import { convertArrayToImg, convertFloatToImg, convertFloatToInt8, convertImgToFloat, imageToDataURL, normalize, normalizeAndTranspose, padImageToSquare, padToSquare, resize, resize_longer, transposeChannelDim } from "../helpers/imageHelpers"

export default function Layer(props) {
  const image = props.image;
  // const [processedImage, setImage] = React.useState(image.img)
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [visibilityIcon, setVisibilityIcon] = React.useState(true);
  const [opacity, setOpacity] = React.useState(image.opacity);
  const [selected, setSelected] = React.useState(false);
  const [clicks, setClick] = useState(null); // ONNX model
  const [tensor, setTensor] = useState(null); // Image embedding tensor

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

  // pre-computed image embedding
  useEffect(() => {

    const click = {
      x: 120,
      y: 120,
      clickType: 1,
    };
    setClick([click]);
    // Load the Segment Anything pre-computed embedding
    //   Promise.resolve(samEncoder(image)).then(
    //     (embedding) => {
    //       setTensor(encodedTensor)}
    //   );
  }, []);

  // Decode a Numpy file into a tensor.
  const loadNpyTensor = async (tensorFile, dType) => {
    let npLoader = new npyjs();
    let npArray = await npLoader.load(tensorFile).then((npArray) => {
      console.log("embedding npy", npArray.data, npArray.data.reduce(
        (partialSum, a) => partialSum + a,
        0,
      ),)
      return npArray;
    }
      );

    const tensor = new ort.Tensor(dType, npArray.data, npArray.shape);
    console.log("tensor ", tensor, npArray.shape);
    return tensor;
  };

  const brainExtract = async () => {
    brainExtractionModel(image, props.onModel);
  };

  function Float32Concat(buffer)
  {
    var bufferLength = buffer.length,
          result = new Uint8Array(bufferLength * 3);

      for(var i = 0; i < bufferLength; i++) {
        result[3*i] = (buffer[i]);
        result[3*i+1] = (buffer[i]);
        result[3*i+2] = (buffer[i]);
        // result[4*i+3] = 255;
      }
      return result;
  }

  function addChannelDim(buffer) {
    var bufferLength = buffer.length,
          result = new Uint8Array(bufferLength / 3 * 4);

      for(var i = 0; i < bufferLength; i+=3) {
        result[4*i/3] = buffer[i]*255;
        result[4*i/3+1] = buffer[i+1]*255;
        result[4*i/3+2] = buffer[i+2]*255;
        result[4*i/3+3] = 255;
      }
      return result;
  }

  function imagedata_to_image(imagedata) {
    let addedChannel = addChannelDim(imagedata)
    console.log("addedChannel", addedChannel)
    let imageUint8Clamped = new Uint8ClampedArray(addedChannel)
    let imageData = new ImageData(imageUint8Clamped, 1024, 1024);
    
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(imageData, 0, 0);


    var image = new Image();
    image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.
    window.location.href=image; 
    return image;
}

  const downloadToFile = (content, filename, contentType) => {
    const a = document.createElement('a');
    const file = new Blob([content], {type: contentType});
    
    a.href= URL.createObjectURL(file);
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(a.href);
  };

  const runSam = async () => {
    const IMAGE_EMBEDDING = new URL("./model/head.npy", document.baseURI).href;

    // const rowArray = colToRow(image, image.img)
    const imageArray = image.img.slice(image.dims[1]*image.dims[2]*59, image.dims[1]*image.dims[2]*60 )
    console.log("imageArray", imageArray.reduce(
      (partialSum, a) => partialSum + a,
      0,
    ))
    let imageUint8 = new Uint8Array(imageArray)
    console.log("imageUint8", imageUint8.reduce(
      (partialSum, a) => partialSum + a,
      0,
    ))
    let imageBuffer = Float32Concat(imageUint8)
    console.log("imageBuffer", imageBuffer, imageBuffer.reduce(
      (partialSum, a) => partialSum + a,
      0,
    ))
    // let imageData0 = new ImageData(imageBuffer, image.dims[1]*2, image.dims[2]);
    let image0 = convertArrayToImg(imageBuffer, [image.dims[1], image.dims[2]])
    console.log("image0", image0, image0.bitmap.data.reduce((a,b) => a+b, 0))
    let imageObject = {
      data: imageBuffer,
      width: image.dims[1],
      height: image.dims[2],
    };

    const resizedImage = resize_longer(image0, 1024,true)
    console.log("resizedImage", resizedImage, resizedImage.bitmap.data.reduce((a,b) => a+b, 0))
    // const permutedImage = convertImgToFloat(resizedImage.bitmap.data)
    const normalizedArray = normalize(resizedImage.bitmap.data, [123.675, 116.28, 103.53], [58.395, 57.12, 57.375])
    // let normalizedImage = convertFloatToImg(normalizedArray, [resizedImage.bitmap.width, resizedImage.bitmap.height], false);
    // console.log("normalizedImage", normalizedImage, normalizedImage.bitmap.data.reduce((a,b) => a+b, 0))
    const paddedImage = padImageToSquare(normalizedArray, resizedImage.bitmap.width, resizedImage.bitmap.height, [0, 0, 0])
    console.log("paddedImage", paddedImage, paddedImage.reduce((a,b) => a+b, 0))
    // const imageToFloat = convertImgToFloat(paddedImage.bitmap.data, [1024, 1024, 3])
    // console.log("imageToFloat", imageToFloat, imageToFloat.reduce((a,b) => a+b, 0))
    // const imageToUint8 = convertFloatToInt8(imageToFloat)
    // console.log(imageToUint8)
    const transposedArray = transposeChannelDim(paddedImage, 3)
    // const oneSlice = new Uint8ClampedArray(paddedImage.bitmap.data)
    // console.log("oneSlice", oneSlice)
    // let imageData = new ImageData(oneSlice, 1024, 1024);
    // console.log("image1", image1)

    // downloadToFile(new Float32Array(imageBuffer).buffer, 'stacked.raw', 'text/plain');

    await samEncoder(transposedArray).then((embedding) => {
      console.log("embedding", embedding, embedding.reduce(
        (partialSum, a) => partialSum + a,
        0,
      ),)
      let encodedTensor = new ort.Tensor(
        "float32",
        embedding,
        [1, 256, 64, 64],
      );
      // setTensor(encodedTensor)
      samModel(image, encodedTensor, clicks, props.onModel);
    });
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

  function handleNiimath() {
    processImage(image, props.onPreprocess);
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
          <IconButton onClick={runSam}>
            <PlayCircleFilledWhiteIcon />
          </IconButton>
          <IconButton
            sx={{ fontSize: "13px", borderRadius: "5px" }}
            onClick={handleNiimath}
          >
            NiiMath
          </IconButton>
          <IconButton onClick={handleDelete}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
}
