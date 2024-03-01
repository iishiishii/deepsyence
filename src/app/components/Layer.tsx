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
import {
  convertArrayToImg,
  downloadToFile,
  filterZero,
  imagedataToImage,
  normalize,
  normalizeArray,
  padToSquare,
  resize,
  resizeLonger,
  stackSliceToRGB,
  standardizeArray,
  transposeChannelDim,
} from "../helpers/imageHelpers";
import * as nj from "numjs";
import { cv } from "opencv-wasm";

export default function Layer(props) {
  const image = props.image;
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
  const [fetchRate, setFetchRate] = useState(0);
  const [embedded, setEmbedded] = useState([] as ort.Tensor[] || null);

  useEffect(() => {
    async function checkResponseTime(testURL) {
      let time1 = performance.now();
      await fetch(testURL);
      let time2 = performance.now();
      return 43783 / (time2 - time1);
    }

    (async () => {
      // for the purpose of this snippet example, some host with CORS response
      let rate = await checkResponseTime(
        "https://iishiishii.github.io/deepsyence/process-image.wasm",
      );
      console.log(rate);
      setFetchRate(rate);
    })();
  }, []);


  const preprocessVolume = (image) => {
    try {
      const MEAN = [51.38294238181054, 51.38294238181054, 51.38294238181054],
        STD = [64.6803075646777, 64.6803075646777, 64.6803075646777];
      // const imageRAS = image.img2RAS();
      
      const standardizedArray = standardizeArray(image, MEAN, STD);
      const normalizedArray = normalizeArray(standardizedArray, image.calMax, image.calMin);
      console.log("normalizedArray ", normalizedArray);
      const filteredArray = filterZero(image, normalizedArray);
      const imageUint8 = new Uint8Array(filteredArray);

      console.log("imageUint8 ", imageUint8);

      return imageUint8;
    } catch (e) {
      console.log(`failed to preprocess volume: ${e}. `);
      throw Error(`failed to preprocess volume: ${e}. `);
    }
  }

  const preprocess = (image, sliceId) => {
    try {
      const imageRAS = image.img2RAS();

      const imageArray = preprocessVolume(imageRAS);
      console.log("imageArray ", imageArray);

      const sliceArray = imageArray.slice(
        image.dims[1] * image.dims[2] * sliceId,
        image.dims[1] * image.dims[2] * (sliceId + 1),
      );
      const src = cv.matFromArray(image.dims[1], image.dims[2], cv.CV_8UC1, sliceArray);
      let dst = new cv.Mat(1024, 1024);

      const resizedImage = cv.resize(src, dst, dst.size(), 0, 0, cv.INTER_LINEAR);
      console.log("resizedImage ", resizedImage);
      const image3Channels = stackSliceToRGB(resizedImage.data);

      downloadToFile(new Uint8Array(image3Channels), "/home/thuy/repo/deepsyence/resizedImage.jpg", "image/jpeg");
      // const transposedArray = transposeChannelDim(resizedImage.bitmap.data, 3);
      return image3Channels;
    } catch (e) {
      console.log(`failed to inference ONNX model: ${e}. `);
      throw Error(`failed to inference ONNX model: ${e}. `);
    }
  };

  const runEncoder = async () => {
    // console.log("image name", image);
    setMaskImg(
      new Uint8Array(
        image.dimsRAS[1] * image.dimsRAS[2] * image.dimsRAS[3],
      ).fill(0),
    );
    if (image.name === "sub-M2002_ses-a1440_T2.nii") {
      const IMAGE_EMBEDDING =
        "https://objectstorage.us-ashburn-1.oraclecloud.com/n/sd63xuke79z3/b/neurodesk/o/sub-M2002_ses-a1440_T2w.npy";
      // const IMAGE_EMBEDDING = new URL(
      //   "./model/sub-M2002_ses-a1440_T2w.npy",
      //   document.baseURI,
      // ).href;
      // Load the Segment Anything pre-computed embedding
      let UPDATE_AMOUNT = (1 / 90) * 100;
      setProgress(UPDATE_AMOUNT);
      try {
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
          922747008 / fetchRate / 10,
        );

        loadNpyTensor(IMAGE_EMBEDDING, "float32")
          .then((embedding) => {
            if (embedding) {
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

        let topLeft = { x: 0, y: 0, z: 0, clickType: 2 };
        let bottomRight = { x: 153, y: 214, z: 0, clickType: 3 };
        setBbox({ topLeft, bottomRight });
      } catch (error) {
        props.onAlert(`error embedding ${error}`);
        console.log("error embedding", error);
      }
    } else {
      // setEmbedded([]);
      const start = 90;
      const end = 91;

      for (let i = 0; i < start; i++) {
        setEmbedded((embedded) => [...embedded, new ort.Tensor("float32", [], [0])]);
      }
      try {
        for (let i = start; i < end; i++) {
          const preprocessedImage = preprocess(image, i);
          // console.log("samModel", samModel);
          await samModel!.process(preprocessedImage, i).then((result) => {
            if (i === end - 1) {
              console.log("embedding", [...embedded, ...result!.embedding!]);
              // https://stackoverflow.com/questions/37435334/correct-way-to-push-into-state-array
              setEmbedded((embedded) => [...embedded, ...result!.embedding!]);
              console.log("embedding after", embedded, embedded.length);

            }
          });
          setProgress((prevProgress) =>
            prevProgress >= 100
              ? 100
              : prevProgress + (1 / (end - start)) * 100,
          );
        }
        setDone(!done);
        let topLeft = { x: 0, y: 0, z: 0, clickType: 2 };
        let bottomRight = { x: 153, y: 214, z: 0, clickType: 3 };
        setBbox({ topLeft, bottomRight });
        console.log("embedded end", embedded);
      } catch (error) {
        props.onAlert(`Encoder ${error}`);
        console.log("error encoder", error);
      }
    }
  };

  const runDecoder = async () => {
    try {
      if (image.name === "lesion_mask.nii") return;
      if (clicks!.length === 0 && !bbox) return;
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
      console.log("running decoder, embedding: ", embedded, maskImg);

      await samModel
        .processDecoder(image, embedded[clicks![0].z], clicks!, bbox!)
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
    console.log("running decoder, embedding: ", embedded);

    if (clicks && penMode < 0) {
      console.log("running decoder, embedding: ", embedded);

      // Check if clicks changed and selected is not null
      runDecoder();
    }
    console.log("clicks", clicks);
  }, [clicks]);

  // Decode a Numpy file into a tensor.
  const loadNpyTensor = async (tensorFile, dType) => {
    let npLoader = new npyjs();
    let npArray = await npLoader.load(tensorFile).then((npArray) => {
      return npArray;
    });
    let tensorArray: ort.TypedTensor<"string">[] = [];
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
