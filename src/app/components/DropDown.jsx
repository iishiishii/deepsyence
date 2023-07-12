import * as React from "react";
import { alpha, styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Menu, { MenuProps } from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import EditIcon from "@mui/icons-material/Edit";
import Divider from "@mui/material/Divider";
import ArchiveIcon from "@mui/icons-material/Archive";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import NVTick from "./Tick";

const StyledMenu = styled((props) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "right",
    }}
    {...props}
  />
))(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color:
      theme.palette.mode === "light"
        ? "rgb(55, 65, 81)"
        : theme.palette.grey[300],
    boxShadow:
      "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    "& .MuiMenu-list": {
      padding: "4px 0",
    },
    "& .MuiMenuItem-root": {
      "& .MuiSvgIcon-root": {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5),
      },
      "&:active": {
        backgroundColor: alpha(
          theme.palette.primary.main,
          theme.palette.action.selectedOpacity,
        ),
      },
    },
  },
}));

export default function CustomizedMenus(props) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const nv = props.nv;

  const [radiological, setRadiological] = React.useState(false);
  const [crosshair3D, setCrosshair3D] = React.useState(false);
  const [colorBar, setColorBar] = React.useState(nv.opts.isColorbar);
  const [clipPlane, setClipPlane] = React.useState(
    nv.currentClipPlaneIndex > 0 ? true : false,
  );

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

  return (
    <div>
      <Button
        id="demo-customized-button"
        aria-controls={open ? "demo-customized-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        variant="contained"
        disableElevation
        onClick={handleClick}
        endIcon={<KeyboardArrowDownIcon />}
      >
        View
      </Button>
      <StyledMenu
        id="demo-customized-menu"
        MenuListProps={{
          "aria-labelledby": "demo-customized-button",
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem disableRipple>
          <NVTick
            checked={clipPlane}
            title={"Clip plane"}
            onChange={nvUpdateClipPlane}
            color="companyRed"
          ></NVTick>
        </MenuItem>

        <MenuItem disableRipple>
          <NVTick
            checked={radiological}
            title={"radiological"}
            onChange={nvUpdateRadiological}
          ></NVTick>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem disableRipple>
          <NVTick
            checked={crosshair3D}
            title={"3D crosshair"}
            onChange={nvUpdateCrosshair3D}
          ></NVTick>
        </MenuItem>
        <MenuItem disableRipple>
          <NVTick
            checked={colorBar}
            title={"Show color bar"}
            onChange={nvUpdateColorBar}
          ></NVTick>
        </MenuItem>
      </StyledMenu>
    </div>
  );
}
