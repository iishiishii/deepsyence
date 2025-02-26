import { useContext } from "react";
import { Grid } from "@mui/material";
import { BsFillEraserFill } from "react-icons/bs";
import { RiPaintFill } from "react-icons/ri";
import { AiOutlineClose, AiOutlineEdit } from "react-icons/ai";
import Divider from "@mui/material/Divider";
import { color as handleColor, hsvaToHex } from "@uiw/color-convert";
import Swatch from "@uiw/react-color-swatch";
import { IconContext } from "react-icons";
import AppContext from "../hooks/createContext";
import { Typography } from "antd";

interface Props {
  niivue: any;
}

export default function Annotation({ niivue }: Props) {
  const nv = niivue;
  nv.setDrawColormap("$slicer3d");

  const {
    penMode: [penMode, setPenMode],
    filled: [filled, setFill],
  } = useContext(AppContext)!;

  const modeValueMaps: number[] = [1, 2, 3, 4, 5];
  const colors = ["#80AE80", "#F1D691", "#B17A65", "#6FB8D2", "#D8654F"];

  function doDrawPen(event: any) {
    let mode = event;
    if (event !== 0 && event !== -1) {
      let hex = hsvaToHex(event);
      let colorIndex = colors.indexOf(hex.toUpperCase());
      mode = modeValueMaps[colorIndex];
    }
    nv.setDrawingEnabled(mode >= 0);
    nv.setPenValue(mode, filled);
    setPenMode(mode);
  }

  function handleFill(fill: boolean) {
    nv.setDrawingEnabled(true);
    if (penMode < 0) {
      nv.setPenValue(1, fill);
      setPenMode(1);
    } else {
      nv.setPenValue(penMode, fill);
    }
    setFill(fill);
    // console.log(filled);
  }

  return (
    <div className="navbar-draw" style={{ width: "100%", backgroundColor: "#ffffff" }}>
      {/* <Grid container spacing={1} alignItems="flex-end"> */}
      <p style={{padding: "10px", marginBottom: "0", marginTop: "0"}}>Label color</p>
      <Grid item xs={10} marginLeft={"10px"}>
        <Swatch
          colors={colors}
          style={{
            paddingLeft: 10,
          }}
          rectProps={{
            style: {
              marginRight: 10,
              marginBottom: 10,
              borderRadius: 4,
              height: 22,
              width: 22,
            },
          }}
          onChange={doDrawPen}
        />
      </Grid>
      <Divider
        orientation="horizontal"
        sx={{ my: "1px", borderWidth: "1px" }}
      />
      <p style={{padding: "10px", marginBottom: "0", marginTop: "0"}}>Pen mode</p>
      <Grid container spacing={1} justifyContent="space-evenly">
        <Grid item xs={6} md={2}>
          <IconContext.Provider
            value={{
              style: {
                boxShadow: penMode == 0 ? "inset 1px 1px 1px #496A81" : "",
              },
            }}
          >
            <BsFillEraserFill
              size={22}
              onClick={(e) => {
                e.stopPropagation();
                doDrawPen(0);
              }}
            />
          </IconContext.Provider>
        </Grid>
        <Grid item xs={6} md={2}>
          <IconContext.Provider
            value={{
              style: {
                boxShadow:
                  filled == true && penMode > 0
                    ? "inset 1px 1px 1px #496A81"
                    : "",
              },
            }}
          >
            <RiPaintFill
              size={22}
              // style={{ boxShadow: filled ?  "1px 1px 4px #496A81" : ""}}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleFill(true);
              }}
            />
          </IconContext.Provider>
        </Grid>
        <Grid item xs={6} md={2}>
          <IconContext.Provider
            value={{
              style: {
                boxShadow:
                  filled == false && penMode > 0
                    ? "inset 1px 1px 1px #496A81"
                    : "",
              },
            }}
          >
            <AiOutlineEdit
              size={22}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleFill(false);
              }}
            />
          </IconContext.Provider>
        </Grid>
        <Grid item xs={6} md={2}>
          <IconContext.Provider
            value={{
              style: {
                boxShadow: penMode < 0 ? "inset 1px 1px 1px #496A81" : "",
              },
            }}
          >
            <AiOutlineClose
              size={22}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                doDrawPen(-1);
              }}
            />
          </IconContext.Provider>
        </Grid>
      </Grid>
    </div>
  );
}
