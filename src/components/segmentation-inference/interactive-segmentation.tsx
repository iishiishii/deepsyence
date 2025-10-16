"use client";

import type React from "react";

import { useCallback, useState, useEffect } from "react";
import { Card } from "@/components/shadcn-ui/card";
import { ModelMetadata, ModelType } from "@/components/segmentation-inference/model-selector";
import { MousePointer2, Play } from "lucide-react";
import { Button } from "@/components/shadcn-ui/button";
import { toast } from "sonner";
import { UnetModel } from "@/model/unetModel";
import { SegmentAnythingModel } from "@/model/samModel";
import { NVImage } from "@niivue/niivue";
import { segmentationModeMap } from "./image-canvas";

interface SamDecoderProps {
  // model: UnetModel | SegmentAnythingModel | null;
  segmentationMode: "foreground" | "background" | "box" | "none";
  onSetSegmentationMode: (mode: "none" | "foreground" | "background" | "box") => void;
}

export default function SamDecoder({ segmentationMode, onSetSegmentationMode }: SamDecoderProps) {
  // const [isSamModel, setIsSamModel] = useState(false);


  // useEffect(() => {
  //   if (model instanceof SegmentAnythingModel) {
  //     setIsSamModel(true);
  //   } else {
  //     setIsSamModel(false);
  //   }
  // }, [model]);

  // if (!(model instanceof SegmentAnythingModel)) return null;
  // if (!isSamModel) return null;

  return (
    <Card className="mt-4 p-4 bg-primary/5 border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MousePointer2 className="h-4 w-4 text-primary" />
          <h4 className="font-medium">Interactive Segmentation</h4>
        </div>
        {/* {(foregroundPoints.length > 0 || backgroundPoints.length > 0) && (
          <Button size="sm" variant="outline" onClick={clearSegmentationPoints}>
            Clear Points
          </Button>
        )} */}
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        Click on the image to mark foreground or background regions for refined
        segmentation
      </p>

      <div className="flex flex-row items-center">
        <Button
          size="sm"
          variant={segmentationMode === "foreground" ? "default" : "outline"}
          onClick={() => {
            onSetSegmentationMode(
              "foreground"
            );
          }}
          className="flex flex-1 flex-wrap"
        >
          {/* <div className="w-2 h-2 rounded-full bg-green-500 mr-1" /> */}
          ROI
        </Button>
        <Button
          size="sm"
          variant={segmentationMode === "background" ? "default" : "outline"}
          onClick={() => {
            onSetSegmentationMode(
              "background"
            );
          }}
          className="flex flex-1"
        >
          {/* <div className="w-2 h-2 rounded-full bg-red-500 mr-1" /> */}
          Background
        </Button>
        <Button
          size="sm"
          variant={segmentationMode === "box" ? "default" : "outline"}
          onClick={() => {
            onSetSegmentationMode(
              "box"
            );
          }}
          className="flex flex-1"
        >
          {/* <div className="w-2 h-2 rounded-full bg-red-500 mr-1" /> */}
          Bounding Box
        </Button>
      </div>

    </Card>
  );
}
