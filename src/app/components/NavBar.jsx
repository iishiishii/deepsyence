import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import DropDown from "./DropDown";
import { NumberPicker } from "./NumberPicker";
import Annotation from "./Annotation";

export default function NavBar(props) {
  const nv = props.nv;
  const [decimalPrecision, setDecimalPrecision] = React.useState(2);
  const [multiplanarPadPixels, setMultiplanarPadPixels] = React.useState(
    nv.opts.multiplanarPadPixels,
  );
  function updateDecimalPrecision(v) {
    setDecimalPrecision(v);
  }
  
  function nvUpdateMultiplanarPadPixels(v) {
    nv.opts.multiplanarPadPixels = v;
    setMultiplanarPadPixels(v);
    nv.drawScene();
  }
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Deepsyence
          </Typography>
          <Annotation nv={nv}/>
            <DropDown nv={nv}/>
          <Button color="inherit">Computation</Button>
          {/* <NumberPicker
          value={decimalPrecision}
          onChange={updateDecimalPrecision}
          title={"Decimal precision"}
          min={0}
          max={8}
          step={1}
        ></NumberPicker>
        <NumberPicker
          value={multiplanarPadPixels}
          onChange={nvUpdateMultiplanarPadPixels}
          title={"Multiplanar padding"}
          min={0}
          max={20}
          step={2}
        ></NumberPicker> */}
        </Toolbar>
      </AppBar>
    </Box>
  );
}
