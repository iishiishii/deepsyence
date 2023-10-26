import { useContext } from "react";
import { Grid } from "@mui/material";
import { BsFillEraserFill } from "react-icons/bs";
import { RiPaintFill } from "react-icons/ri";
import { AiOutlineEdit } from "react-icons/ai";
import Divider from "@mui/material/Divider";
import { color as handleColor, hsvaToHex } from "@uiw/color-convert";
import Swatch from "@uiw/react-color-swatch";
import { IconContext } from "react-icons";
import AppContext from "../hooks/createContext";

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

  const modeValueMaps: number[] = [1, 2, 3, 4, 5, 12];
  const colors = ["#80AE80", "#F1D691", "#B17A65", "#6FB8D2", "#D8654F"];

  function doDrawPen(event: any) {
    console.log(event);
    if (event === 12) {
      console.log("erase")
      //erase selected cluster
      nv.setPenValue(-0);
      setPenMode(event);
    }
    else {
      let hex = hsvaToHex(event);
      console.log(hex);
      let colorIndex = colors.indexOf(hex.toUpperCase());
      console.log(colorIndex);
      const mode = modeValueMaps[colorIndex];
      console.log(mode);
      nv.setDrawingEnabled(mode >= 0);
      nv.setPenValue(mode, filled);
      setPenMode(mode);
    }
  }

  function handleFill(fill: boolean) {
    console.log(fill);
    nv.setPenValue(penMode, fill);
    setFill(fill);
    console.log(filled);
  }

  return (
    <div style={{ width: "210px" }}>
      {/* <Grid container spacing={1} alignItems="flex-end"> */}
      <Grid item xs={10} marginLeft={"10px"}>
        <Swatch
          colors={colors}
          style={{
            paddingLeft: 10,
            paddingTop: 10,
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
        component="li"
        sx={{ my: "1px", borderWidth: "1px" }}
      />
      <Grid container spacing={1} alignItems="flex-end">
        <Grid item xs={3} marginLeft={"20px"}>
          <BsFillEraserFill size={22} 
            onClick={(e) => {
              e.stopPropagation();
              doDrawPen(12)
            }}
          />
        </Grid>
        <Grid item xs={3}>
          <IconContext.Provider
            value={{
              style: {
                boxShadow: filled == true ? "inset 1px 1px 1px #496A81" : "",
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
        <Grid item xs={3}>
          <IconContext.Provider
            value={{
              style: {
                boxShadow: filled == false ? "inset 1px 1px 1px #496A81" : "",
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
      </Grid>
    </div>
  );
}
