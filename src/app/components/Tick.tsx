import { Box, Grid } from "@mui/material";
import { Typography } from "@mui/material";
import React from "react";
import DoneIcon from "@mui/icons-material/Done";

export default function NVTick(props) {
  function handleChange() {
    props.onChange();
  }

  return (
    <Grid
      container
      sx={{
        display: "flex",
        alignItems: "left",
      }}
      // m={1}
    >
      <Grid item xs={11}>
        <Typography
          onClick={handleChange}
          style={{
            marginRight: "auto",
          }}
        >
          {props.title}
        </Typography>
      </Grid>
      <Grid item xs={1}>
        {props.checked ? <DoneIcon onChange={handleChange}></DoneIcon> : <></>}
      </Grid>
    </Grid>
  );
}
