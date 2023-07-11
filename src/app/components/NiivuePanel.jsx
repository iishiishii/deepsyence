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
        width: "70%",
        height: "100%",
      }}
    >
      <canvas ref={canvas} height={480} width={640} />
    </Box>
  );
}
