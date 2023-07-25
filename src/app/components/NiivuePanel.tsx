import React, { useContext, useEffect, useState } from "react";
import { Box } from "@mui/material";
import { modelInputProps } from "../helpers/Interfaces";
import AppContext from "../hooks/createContext";
import * as _ from "underscore";


export function NiivuePanel({ nv, volumes}: any) {
  const canvas = React.useRef(null);
  const {
    image: [image],
    maskImg: [maskImg, setMaskImg],
  } = useContext(AppContext)!;

  const {
    clicks: [, setClicks],
  } = useContext(AppContext)!;

  const getClick = (x: number, y: number): modelInputProps => {
    const clickType = 1;
    return { x, y, clickType };
  };


  // Get mouse position and scale the (x, y) coordinates back to the natural
  // scale of the image. Update the state of clicks with setClicks to trigger
  // the ONNX model to run and generate a new mask via a useEffect in App.tsx
  const handleMouseMove = _.throttle((e: any) => {
    let el = e.nativeEvent.target;
    const rect = el.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    const imageScale = image ? image.width / el.offsetWidth : 1;
    x *= imageScale;
    y *= imageScale;
    const click = getClick(x, y);
    if (click) setClicks([click]);
  }, 15);


  React.useEffect(() => {
    async function fetchData() {
      const niivue = nv;
      niivue.attachToCanvas(canvas.current);
      await niivue.loadVolumes(volumes);
    }
    fetchData();
  }, []);

  return (
    <div style={{ width: "75%" }}>
      <canvas 
          ref={canvas}        
          onMouseMove={handleMouseMove}
          onMouseOut={() => _.defer(() => setMaskImg(null))}
          onTouchStart={handleMouseMove}/>
      <div
        id="intensity"
        style={{
          height: "30px",
          width: "200px",
          position: "fixed",
          bottom: "0",
          left: "0",
          // backgroundColor: "rgba(0,0,0,0.9)",
          // borderRadius: "5px",
          // boxShadow: "0px 1px 4px #496A81 inset",
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
