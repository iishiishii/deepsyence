/* eslint-disable react/jsx-key*/
import { useContext, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Annotation from "./Annotation";
import { Box } from "@mui/material";
import ArrowRight from "@mui/icons-material/ArrowRight";
import { Dropdown, DropdownMenuItem, DropdownNestedMenuItem } from "./Dropdown";
import NVTick from "./Tick";
import ModelSelector from "./ModelSelector";
import { ModelType } from "../browser/modelConfig";
import { SegmentAnythingModel } from "../browser/samModel";
import { ImageModel } from "../browser/imageModel";
import AppContext from "../hooks/createContext";
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import Tutorial from "./Tutorial";
import MenuBookIcon from "@mui/icons-material/MenuBook";

export default function NavBar(props) {
  const nv = props.nv;

  const [color, setColor] = useState("Gray");
  const [sliceType, setSliceType] = useState("multi");
  const [radiological, setRadiological] = useState(false);
  const [crosshair3D, setCrosshair3D] = useState(false);
  const [colorBar, setColorBar] = useState(nv.opts.isColorbar);
  const [clipPlane, setClipPlane] = useState(
    nv.currentClipPlaneIndex > 0 ? true : false,
  );
  const [tutorialRun, setTutorialRun] = useState(false);
  let tutorial = tutorialRun ? <Tutorial /> : null;
  const {
    clicks: [, setClicks],
    model: [, setSamModel],
    modelLoading: [, setLoading],
    positivePoints: [, setPositivePoints],
  } = useContext(AppContext);

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
      for (let i = 0; i < input.files.length; i++) {
        props.onAddLayer(input.files[i]);
      }
    };

    input.click();
    setClicks(null);
  }

  function handleSaveImage() {
    nv.saveImage("draw.nii", false);
  }

  const loadSamModel = async (id) => {
    setLoading(true);
    const result = await ImageModel.create(id);
    setSamModel(result.model);
    setLoading(false);
  };

  useEffect(() => {
    loadSamModel("segment-anything-quant");
  }, []);

  function handleTutorialRun() {
    console.log("tutorial run", tutorialRun);
    setTutorialRun(!tutorialRun);
  }

  return (
    <div style={{ width: "100%" }}>
      <Box sx={{ height: "36px", backgroundColor: "#496A81" }}>
        <Dropdown
          trigger={
            <Button className="navbar-file" sx={{ color: "white" }}>
              File
            </Button>
          }
          menu={[
            // <DropdownMenuItem onClick={handleAddLayer}>
            //   {"Upload File"}
            // </DropdownMenuItem>,
            <DropdownMenuItem onClick={handleSaveImage}>
              {"Download Annotation"}
            </DropdownMenuItem>,
          ]}
        />
        <Dropdown
          trigger={<Button sx={{ color: "white" }}>View</Button>}
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
        <Dropdown
          trigger={
            <Button className="navbar-draw" sx={{ color: "white" }}>
              Annotation
            </Button>
          }
          menu={[<Annotation niivue={nv} />]}
        />
        <Tooltip title="Region of Interest point">
          <IconButton
            sx={{ color: "white" }}
            onClick={(e) => {
              setPositivePoints(true);
            }}
          >
            <PlusCircleOutlined />
          </IconButton>
        </Tooltip>
        <Tooltip title="Background point">
          <IconButton
            sx={{ color: "white" }}
            onClick={(e) => {
              setPositivePoints(false);
            }}
          >
            <MinusCircleOutlined />
          </IconButton>
        </Tooltip>
        <Tooltip title="Tutorial">
          <IconButton
            sx={{ color: "white" }}
            onClick={(e) => {
              handleTutorialRun();
            }}
          >
            <MenuBookIcon sx={{ color: "white" }} />
          </IconButton>
        </Tooltip>
        {tutorial}
      </Box>
    </div>
  );
}
