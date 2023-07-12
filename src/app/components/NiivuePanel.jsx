import React from "react";
import { Box } from "@mui/material";

export function NiivuePanel(props) {
  const canvas = React.useRef(null);

  React.useEffect(() => {
    async function fetchData() {
      const nv = props.nv;
      nv.attachToCanvas(canvas.current);
      await nv.loadVolumes(props.volumes);
    }
    fetchData();
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        width: "75%",
        // height: "100%",
      }}
    >
      <canvas ref={canvas} />
    </Box>
  );
}
