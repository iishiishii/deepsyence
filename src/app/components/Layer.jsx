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
import AppContext from "../hooks/createContext";
import { useContext, useEffect, useMemo, useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import { processImage } from "../helpers/niimath";
import { brainExtractionModel } from "../helpers/brainExtractionModel";
import { samDecoder, samEncoder } from "../helpers/samModel";
import {
  convertArrayToImg,
  imagedataToImage,
  normalize,
  padToSquare,
  resizeLonger,
  stackSliceToRGB,
  transposeChannelDim,
} from "../helpers/imageHelpers";
import npyjs from "npyjs";
import CircularWithValueLabel from "./ProgressLoad";

export default function Layer(props) {
  const image = props.image;
  // const [processedImage, setImage] = React.useState(image.img)
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [visibilityIcon, setVisibilityIcon] = useState(true);
  const [opacity, setOpacity] = useState(image.opacity);
  const [selected, setSelected] = useState();
  const [done, setDone] = useState(false);
  const {
    clicks: [clicks],
    boxes: [boxes, setBoxes],
    maskImg: [maskImg, setMaskImg],
    model: [samModel],
    penMode: [penMode],
    modelLoading: [loading],
  } = useContext(AppContext);
  const [progress, setProgress] = useState(0);
  const [embedded, setEmbedded] = useState(null);
  let Visibility = visibilityIcon ? <VisibilityIcon /> : <VisibilityOffIcon />;
  let ArrowIcon = detailsOpen ? (
    <KeyboardArrowUpIcon />
  ) : (
    <KeyboardArrowDownIcon />
  );

  const preprocess = (sliceId) => {
    const MEAN = [123.675, 116.28, 103.53],
      STD = [58.395, 57.12, 57.375];
    const imageRAS = image.img2RAS();
    const imageArray = imageRAS.slice(
      image.dims[1] * image.dims[2] * sliceId,
      image.dims[1] * image.dims[2] * (sliceId + 1),
    );

    const imageUint8 = new Uint8Array(imageArray);
    const image3Channels = stackSliceToRGB(imageUint8);
    const arrayToImage = convertArrayToImg(image3Channels, [
      image.dims[1],
      image.dims[2],
    ]);
    const resizedImage = resizeLonger(arrayToImage, 1024);
    const normalizedArray = normalize(resizedImage.bitmap.data, MEAN, STD);
    const paddedImage = padToSquare(
      normalizedArray,
      resizedImage.bitmap.width,
      resizedImage.bitmap.height,
      [0, 0, 0],
    );
    // console.log("paddedImage", paddedImage, paddedImage.reduce((a,b) => a+b, 0))
    // imagedataToImage(paddedImage)
    const transposedArray = transposeChannelDim(paddedImage, 3);
    return transposedArray;
  };

  const runEncoder = async () => {
    console.log("image name", image.name);
    if (image.name === "sub-M2054_ses-b1942_T2w.nii") {
      const IMAGE_EMBEDDING = "https://objectstorage.us-ashburn-1.oraclecloud.com/n/sd63xuke79z3/b/neurodesk/o/sub-M2054_ses-b1942_T2w_axial_finetuned.npy";
      // const IMAGE_EMBEDDING = new URL(
      //   "./model/sub-M2054_ses-b1942_T2w_axial_finetuned.npy",
      //   document.baseURI,
      // ).href;
      // Load the Segment Anything pre-computed embedding

      try {
        let updater = setInterval(() => {
          let updateAmount = (2 / 90) * 100;
          setProgress((prevProgress) => {
            let newProgress = prevProgress + updateAmount;
            if (newProgress >= 100) {
              clearInterval(updater);
              newProgress = 100;
            }
            return newProgress;
          });
        }, 5000);

        loadNpyTensor(IMAGE_EMBEDDING, "float32")
          .then((embedding) => {
            if (embedding) {
              console.log("embedding", embedding);
              setEmbedded([...embedding]);
            } else {
              console.debug("Server didn't start in time");
            }
          })
          .then(() => {
            clearInterval(updater);
            setProgress(100);
            props.onAlert("Embedding loaded", false);
          });

        let topLeft = { x: 0, y: 226, z: 0, clickType: 2 };
        let bottomRight = { x: 157, y: 0, z: 0, clickType: 3 };
        setBoxes([[topLeft, bottomRight]]);
        setMaskImg(
          new Uint8Array(image.dims[1] * image.dims[2] * image.dims[3]).fill(0),
        );
      } catch (error) {
        props.onAlert(`error embedding ${error}`);
        console.log("error embedding", error);
      }
    } else {
      setEmbedded([]);
      const start = 140;
      const end = 149;

      for (let i = 0; i < start; i++) {
        setEmbedded((embedded) => [...embedded, []]);
      }
      try {
        for (let i = start; i < end; i++) {
          const preprocessedImage = preprocess(i);
          console.log("samModel", samModel);
          await samModel.process(preprocessedImage).then((result) => {
            console.log("embedding", result.embedding);
            if (i === end - 1) {
              setEmbedded((embedded) => [...embedded, ...result.embedding]);
              console.log("embedded", embedded);
            }
          });
          setProgress((prevProgress) =>
            prevProgress >= 100
              ? 100
              : prevProgress + (1 / (end - start)) * 100,
          );
          // https://stackoverflow.com/questions/37435334/correct-way-to-push-into-state-array
          // await samEncoder(preprocessedImage).then((embedding) => {
          //   setEmbedded((embedded) => [...embedded, embedding]);
          // });
        }
        setDone(!done);
      } catch (error) {
        props.onAlert(`Encoder ${error}`);
        console.log("error encoder", error);
      }
    }
  };

  const runDecoder = async () => {
    try {
      if (clicks.length === 0 && boxes.length === 0) return;
      if (embedded === undefined || embedded == null) {
        console.log(`No embedding found for ${image.name}`);
        throw new Error(
          `No embedding found for ${image.name}. Please click the play button to run encoder.`,
        );
      }
      if (loading) {
        throw new Error("Model is loading. Please wait.");
      }
      if (samModel === undefined || samModel == null) {
        console.log("No model found");
        throw new Error("No model found. Select one in the top bar.");
      }

      await samModel
        .processDecoder(image, embedded[clicks[0].z], clicks, boxes, maskImg)
        .then((result) => {
          props.onModel(image.id, image.name, result);
          setMaskImg(result);
        });
    } catch (error) {
      props.onAlert(`Decoder ${error}`);
      console.log("error decoder", error);
    }
  };

  // pre-computed image embedding
  useEffect(() => {
    console.log("penmode", penMode);

    if (clicks && penMode < 0) {
      // Check if clicks changed and selected is not null
      runDecoder();
    }
  }, [clicks]);

  // Decode a Numpy file into a tensor.
  const loadNpyTensor = async (tensorFile, dType) => {
    let npLoader = new npyjs();
    let npArray = await npLoader.load(tensorFile).then((npArray) => {
      // console.log("embedding npy", npArray.data, npArray.data.slice(111*npArray.shape[1]*npArray.shape[2]*npArray.shape[3], 112*npArray.shape[1]*npArray.shape[2]*npArray.shape[3]).reduce(
      //   (partialSum, a) => partialSum + a,
      //   0,
      // ),)
      return npArray;
    });
    let tensorArray = [];
    for (let i = 0; i < npArray.shape[0]; i++) {
      let slice = npArray.data.slice(
        i * npArray.shape[1] * npArray.shape[2] * npArray.shape[3],
        (i + 1) * npArray.shape[1] * npArray.shape[2] * npArray.shape[3],
      );
      tensorArray.push(
        new ort.Tensor(dType, slice, [
          1,
          npArray.shape[1],
          npArray.shape[2],
          npArray.shape[3],
        ]),
      );
    }
    // const tensor = new ort.Tensor(dType, npArray.data, npArray.shape);
    console.log("tensor ", tensorArray, npArray.shape);
    return tensorArray;
  };

  const brainExtract = async () => {
    brainExtractionModel(image, props.onModel);
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
    // console.log(currentOpacity);
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
        {/* <Box style={{ marginRight: "auto" }}>{DoneIcon}</Box> */}
        <CircularWithValueLabel progress={progress} />
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
          <IconButton onClick={runEncoder}>
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
