"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { Niivue, NVImage, DRAG_MODE } from "@niivue/niivue";
import ViewSelector from "@/components/segmentation-inference/view-selector";
import { ViewMode } from "@/components/segmentation-inference/view-selector";
import ImageUploader from "@/components/segmentation-inference/image-uploader";
import { Button } from "@/components/shadcn-ui/button";
import { Palette } from "lucide-react";
import Annotation from "@/components/segmentation-inference/annotation";
import * as _ from "underscore";
import { boundingBox, modelInputProps } from "@/helpers/Interfaces";
import { UnetModel } from "@/model/unetModel";
import { SegmentAnythingModel } from "@/model/samModel";
import { toast } from "sonner";

interface ImageCanvasProps {
  nvRef: React.RefObject<Niivue>;
  onFileUpload: (files: File[]) => Promise<void>;
  segmentationMode: "none" | "foreground" | "background" | "box";
  selectedModel: SegmentAnythingModel | null;
  drawMask: (mask: Uint8Array, suffix: string) => void;
}

export const sliceTypeMap: { [type: string]: number } = {
  axial: 0,
  coronal: 1,
  sagittal: 2,
  multi: 3,
  render: 4,
};

export const segmentationModeMap: { [mode: string]: number } = {
  background: 0,
  foreground: 1,
  boxTopLeft: 2,
  boxBottomRight: 3,
};


export default function ImageCanvas({ nvRef, onFileUpload, segmentationMode, selectedModel, drawMask }: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [annotateFunction, setAnnotateFunction] = useState<() => void>(() => { });
  const [viewMode, setViewMode] = useState<
    "axial" | "coronal" | "sagittal" | "multi" | "render"
  >("axial");
  const [showColorBoard, setShowColorBoard] = useState(false);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [clicks, setClicks] = useState<modelInputProps[] | null>(null);
  const [bbox, setBbox] = useState<boundingBox | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const nv = nvRef.current;
    console.log("Niivue attached to canvas", nv);
    if (!canvas) return;
    if (!nv) return;
    nv.attachToCanvas(canvas);
    nv.setSliceType(sliceTypeMap[viewMode] || 0); // Default to axial if viewMode is invalid;
    setImageLoaded(true);
  }, []);

  const handleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    if (nvRef.current) {
      nvRef.current.setSliceType(sliceTypeMap[mode] || 0); // Default to axial if mode is invalid
    }
  };

  const renderMultiView = () => {
    if (viewMode !== "multi") return null;

    return (
      <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-1 absolute top-0 left-0 pointer-events-none">
        <div className="border border-primary/30 bg-black/20 flex items-center justify-center">
          <span className="text-white text-xs font-medium">Axial</span>
        </div>
        <div className="border border-primary/30 bg-black/20 flex items-center justify-center">
          <span className="text-white text-xs font-medium">Coronal</span>
        </div>
        <div className="border border-primary/30 bg-black/20 flex items-center justify-center">
          <span className="text-white text-xs font-medium">Sagittal</span>
        </div>
        <div className="border border-primary/30 bg-black/20 flex items-center justify-center">
          <span className="text-white text-xs font-medium">3D</span>
        </div>
      </div>
    );
  };

  const getViewLabel = () => {
    if (viewMode === "multi") return null;
    return (
      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs font-medium">
        <div>{viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View</div>
        <div id="intensity">&nbsp;</div>
      </div>
    );
  };


  const getClick = (x: number, y: number, z: number): modelInputProps | null => {
    let clickType: number;
    if (segmentationMode === "none") return null;
    clickType = segmentationModeMap[segmentationMode];
    if (clickType === undefined) return null;
    return { x, y, z, clickType };
  };

  // // Get mouse position and scale the (x, y) coordinates back to the natural
  // // scale of the image. Update the state of clicks with setClicks to trigger
  // // the ONNX model to run and generate a new mask via a useEffect in App.tsx
  const handleMouseMoveLogic = (e: any) => {
    const nv = nvRef.current;
    let el = canvasRef.current || e.target;
    if (!el) return;
    if (!nv) return;

    let x = nv.frac2vox(nv.scene.crosshairPos)[0];
    let y = nv.frac2vox(nv.scene.crosshairPos)[1];
    let z = nv.frac2vox(nv.scene.crosshairPos)[2];
    const click = getClick(x, y, z);
    if (!click) return;
    if (!clicks || (clicks.length > 0 && z !== clicks[0].z)) {
      // console.log("resetting clicks");
      setClicks([click]);
      return;
    }
    // console.log("clicks", clicks);
    if (click && clicks.length <= 10 && clicks.length >= 0) setClicks([...clicks!, click]);
    if (clicks && clicks.length >= 10) {
      clicks.shift();
      setClicks([...clicks, click]);
    }
  };

  // Use useMemo to create the throttled function ONCE
  const handleMouseMove = useMemo(() => {
    return _.throttle(handleMouseMoveLogic, 15);
  }, [nvRef.current, getClick, clicks, setClicks]); // Dependencies: nv, getClick, and state setters/getters


  const doDragReleaseLogic = (info: any) => {
    console.log("doDragReleaseLogic called", info);
    const nv = nvRef.current;
    if (!nv) return;
    nv.opts.dragMode = DRAG_MODE.callbackOnly;
    if (info.tileIdx < 0) console.log("Invalid drag");
    else if (info.voxStart[2] !== info.voxEnd[2]) return;
    console.log("Drag released", bbox);

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


    // return [info.voxStart[0], info.voxEnd[0], info.voxStart[1], info.voxEnd[1], info.voxStart[2], info.voxEnd[2]]
  };

  const doDragRelease = useMemo(() => {
    return _.throttle(doDragReleaseLogic, 15);
  }, [nvRef.current, setBbox, bbox]);

  const runDecoder = async () => {
    console.log("runDecoder", clicks, bbox);
    try {
      if (clicks === null || (clicks.length === 0 && !bbox))
        return;
      if (!selectedModel) return;
      console.log("running decoder", clicks, bbox);
      await selectedModel
        .processDecoder(clicks[0].z, clicks, bbox)
        .then(() => {
          let result = selectedModel.getDecoderResultAsUint8Array()
          drawMask(result, selectedModel.metadata.id);
        });
    } catch (error) {
      toast(`Decoder ${error}`);
      console.log("error decoder", error);
    }
  };

  useEffect(() => {
    if (clicks || bbox) {
      runDecoder();
    }
    console.log("clicks", clicks);
  }, [clicks, bbox]);

  useEffect(() => {
    if (selectedModel) {
      setClicks(null);
      setBbox(null);
    }
  }, [selectedModel]);

  return (
    <div className="relative flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="niivue-canvas w-full h-full relative bg-[#111]"
        >
          <canvas ref={canvasRef} onMouseMove={annotateFunction} onClick={handleMouseMove}
            onContextMenu={() => {
              if (!nvRef.current) return;
              nvRef.current.onDragRelease = doDragRelease;
            }}></canvas>
          {getViewLabel()}
          {renderMultiView()}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              Loading image...
            </div>
          )}
        </div>
      </div>
      <div className="border-t bg-background p-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <ViewSelector currentView={viewMode} onViewChange={handleViewMode} />
          <Button
            size="sm"
            variant={isAnnotating ? "default" : "outline"}
            onClick={() => {
              setIsAnnotating(!isAnnotating);
              setShowColorBoard(!isAnnotating);
            }}
          >
            <Palette className="h-3 w-3" />
          </Button>
          {showColorBoard && (
            <Annotation
              nvRef={nvRef}
              isAnnotating={isAnnotating}
              onSetIsAnnotating={setIsAnnotating}
              onAnnotateFunction={setAnnotateFunction}
            />
          )}
          <ImageUploader onUpload={onFileUpload} compact={true} />
        </div>
      </div>
    </div>
  );
}
