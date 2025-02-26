import React from "react";
import { Box, Button } from "@mui/material";

export function MaskPanel(nv: any) {
  const canvas = React.useRef(null);

  React.useEffect(() => {
    async function fetchData() {
      const niivue = nv;
      niivue.attachToCanvas(canvas.current);
    }
    fetchData();
  });

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "auto",
        height: "35%",
        padding: "50px",
        justifyContent: "center",
      }}
    >
      <canvas ref={canvas} height={180} width={140} />
    </Box>
  );
}
