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
    <div style={{ width: "75%" }}>
      <canvas ref={canvas} style={{ display: "flex" }} />
      <div
        id="intensity"
        style={{
          height: "30px",
          width: "200px",
          position: "fixed",
          bottom: "0",
          left: "0",
          backgroundColor: "rgba(0,0,0,0.9)",
          borderRadius: "5px",
          boxShadow: "0px 1px 4px #496A81 inset",
          color: "white",
          paddingTop: "6px",
          paddingLeft: "5px",
        }}
      >
        &nbsp;
      </div>
    </div>
  );
}
