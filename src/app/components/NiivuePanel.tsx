import { useContext, useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { boundingBox, modelInputProps } from "../helpers/Interfaces";
import AppContext from "../hooks/createContext";
import * as _ from "underscore";

export function NiivuePanel({ nv, volumes }: any) {
  const canvas = useRef(null);
  const {
    clicks: [clicks, setClicks],
    bbox: [bbox, setBbox],
    positivePoints: [positivePoints],
  } = useContext(AppContext)!;

  const getClick = (x: number, y: number, z: number): modelInputProps => {
    let clickType: number;
    if (positivePoints) {
      clickType = 1;
    } else {
      clickType = 0;
    }
    return { x, y, z, clickType };
  };

  // // Get mouse position and scale the (x, y) coordinates back to the natural
  // // scale of the image. Update the state of clicks with setClicks to trigger
  // // the ONNX model to run and generate a new mask via a useEffect in App.tsx
  const handleMouseMove = _.throttle((e: any) => {
    let el = canvas.current || e.target;
    if (!el) return;

    let x = nv.frac2vox(nv.scene.crosshairPos)[0];
    let y = nv.frac2vox(nv.scene.crosshairPos)[1];
    let z = nv.frac2vox(nv.scene.crosshairPos)[2];
    const click = getClick(x, y, z);

    if (!clicks || (clicks.length > 0 && z !== clicks[0].z)) {
      // console.log("resetting clicks");
      setClicks([click]);
      return;
    }
    // console.log("clicks", clicks);

    if (click && clicks) setClicks([...clicks!, click]);
    if (clicks.length > 10) {
      clicks.shift();
      setClicks([...clicks!, click]);
    }
  }, 15);

  const doDragRelease = _.throttle((info) => {
    nv.opts.dragMode = "callbackOnly";
    if (info.tileIdx < 0) console.log("Invalid drag");
    else if (info.voxStart[2] !== info.voxEnd[2]) return;

    if (bbox) {
      let topLeft: modelInputProps = {
        x: info.voxStart[0],
        y: info.voxEnd[1],
        z: info.voxStart[2],
        clickType: 2,
      };
      let bottomRight: modelInputProps = {
        x: info.voxEnd[0],
        y: info.voxStart[1],
        z: info.voxEnd[2],
        clickType: 3,
      };
      let box: boundingBox = { topLeft, bottomRight };
      setBbox(box);

      console.log("bbox", [topLeft, bottomRight]);
    }

    // return [info.voxStart[0], info.voxEnd[0], info.voxStart[1], info.voxEnd[1], info.voxStart[2], info.voxEnd[2]]
  }, 15);

  useEffect(() => {
    async function fetchData() {
      const niivue = nv;
      niivue.attachToCanvas(canvas.current);
      await niivue.loadVolumes(volumes);
      nv.setSliceType(nv.sliceTypeAxial);
    }
    fetchData();
  }, []);

  return (
    <div className="niivue" style={{ width: "75%" }}>
      <canvas
        ref={canvas}
        onClick={handleMouseMove}
        onContextMenu={() => {
          nv.onDragRelease = doDragRelease;
        }}
        // onMouseOut={() => _.defer(() => setMaskImg(null))}
        onTouchStart={handleMouseMove}
      />
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
