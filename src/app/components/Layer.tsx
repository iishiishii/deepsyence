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
import Tooltip from "@mui/material/Tooltip";
import { processImage } from "../helpers/niimath";
import { brainExtractionModel } from "../helpers/brainExtractionModel";
import npyjs from "npyjs";
import CircularWithValueLabel from "./ProgressLoad";


export default function Layer(props) {
  const image = props.image;
  // console.log("image", image);
  // const [processedImage, setImage] = React.useState(image.img)
  const [detailsOpen, setDetailsOpen] = useState(image.opacity != 0);
  const [visibilityIcon, setVisibilityIcon] = useState(image.opacity != 0);
  const [opacity, setOpacity] = useState(image.opacity);
  const [done, setDone] = useState(false);
  const {
    clicks: [clicks],
    bbox: [bbox, setBbox],
    maskImg: [maskImg, setMaskImg],
    model: [samModel],
    penMode: [penMode],
    modelLoading: [loading],
  } = useContext(AppContext)!;
  const [progress, setProgress] = useState(0);
  // const [embedded, setEmbedded] = useState([] as ort.Tensor[] || null);

  useEffect(() => {
    setProgress(0);
    // setClicks([]);
    props.onModel(image.id, image.name, new Uint8Array());
    setMaskImg(new Uint8Array());
  }, [samModel]);

  const runEncoder = async () => {
    // console.log("image name", image);
    setMaskImg(
      new Uint8Array(
        image.dimsRAS[1] * image.dimsRAS[2] * image.dimsRAS[3],
      ).fill(0),
    );
      // setEmbedded([]);
      const start = 90;
      const end = 91;

      try {
        let UPDATE_AMOUNT = (1 / ((end - start)*10)) * 10;
        setProgress(UPDATE_AMOUNT);
      
        for (let i = start; i < end; i++) {
          console.log("image.dimsRAS[1], image.dimsRAS[2]", image.dimsRAS[1], image.dimsRAS[2])
          // swap height and width to get row major order from npy array to column order

            let updater = setInterval(
              () => {
                setProgress((prevProgress) => {
                  let newProgress = prevProgress + UPDATE_AMOUNT;
                  if (newProgress >= 90) {
                    clearInterval(updater);
                    newProgress = 90;
                  }
                  return newProgress;
                });
              },
              1000,
            );
            await samModel!.process(image, i).then(() => {
              clearInterval(updater);
              setProgress(100);
              props.onAlert("Embedding loaded", false);
            });
            // setProgress((prevProgress) =>
            //   prevProgress >= 100
            //     ? 100
            //     : prevProgress + (1 / (end - start)) * 100,
            // );
        }
        setDone(!done);
        let topLeft = { x: 0, y: 0, z: 0, clickType: 2 };
        let bottomRight = { x: image.dimsRAS[1], y: image.dimsRAS[2], z: 0, clickType: 3 };
        setBbox({ topLeft, bottomRight });
        // console.log("embedded end", embedded);
      } catch (error) {
        props.onAlert(`Encoder ${error}`);
        console.log("error encoder", error);
      }
  };

  const runDecoder = async () => {
    try {
      if (image.name === "lesion_mask.nii") return;
      if (clicks!.length === 0 && !bbox) return;

      if (loading) {
        throw new Error("Model is loading. Please wait.");
      }
      if (samModel === undefined || samModel == null) {
        console.log("No model found");
        throw new Error("No model found. Select one in the top bar.");
      }
      // console.log("running decoder, embedding: ", embedded, maskImg);

      await samModel
        .processDecoder(image, clicks![0].z, clicks!, bbox!)
        .then((result) => {
          props.onModel(image.id, image.name, result);
          setMaskImg(result!);
        });
    } catch (error) {
      props.onAlert(`Decoder ${error}`);
      console.log("error decoder", error);
    }
  };

  // pre-computed image embedding
  useEffect(() => {
    // console.log("running decoder, embedding: ", embedded);

    if (clicks && penMode < 0) {
      // console.log("running decoder, embedding: ", embedded);

      // Check if clicks changed and selected is not null
      runDecoder();
    }
    console.log("clicks", clicks);
  }, [clicks]);

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
            visibilityToggle();
            handleOpacity();
          }}
        >
          {visibilityIcon ? <VisibilityIcon /> : <VisibilityOffIcon />}
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
          {detailsOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
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
          <Tooltip title="Image Encoder">
            <IconButton onClick={runEncoder}>
              <PlayCircleFilledWhiteIcon />
            </IconButton>
          </Tooltip>
          <IconButton onClick={handleDelete}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
}
