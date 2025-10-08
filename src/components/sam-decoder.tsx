"use client";

import type React from "react";

import { useCallback, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ModelMetadata, ModelType } from "@/components/model-selector";
import { MousePointer2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SamDecoderProps {
  model: ModelMetadata | null;
}

export default function SamDecoder({ model }: SamDecoderProps) {
  const [isSamModel, setIsSamModel] = useState(false);
  const [segmentationMode, setSegmentationMode] = useState<
    "none" | "foreground" | "background"
  >("none");
  const [foregroundPoints, setForegroundPoints] = useState<
    { x: number; y: number }[]
  >([]);
  const [backgroundPoints, setBackgroundPoints] = useState<
    { x: number; y: number }[]
  >([]);

  useEffect(() => {
    if (model?.type === ModelType.SegmentAnything) {
      setIsSamModel(true);
    } else {
      setIsSamModel(false);
    }
  }, [model]);

  if (!model) return null;
  if (!isSamModel) return null;

  //   const handleSegmentationClick = useCallback(
  //     (e: React.MouseEvent<HTMLCanvasElement>) => {
  //       if (segmentationMode === "none") return;

  //       const canvas = canvasRef.current;
  //       if (!canvas) return;

  //       const rect = canvas.getBoundingClientRect();
  //       const x = e.clientX - rect.left;
  //       const y = e.clientY - rect.top;

  //       const point = { x, y };

  //       if (segmentationMode === "foreground") {
  //         setForegroundPoints((prev) => [...prev, point]);
  //         // Draw foreground marker
  //         const ctx = canvas.getContext("2d");
  //         if (ctx) {
  //           ctx.fillStyle = "#22c55e";
  //           ctx.beginPath();
  //           ctx.arc(x, y, 5, 0, 2 * Math.PI);
  //           ctx.fill();
  //         }
  //       } else if (segmentationMode === "background") {
  //         setBackgroundPoints((prev) => [...prev, point]);
  //         // Draw background marker
  //         const ctx = canvas.getContext("2d");
  //         if (ctx) {
  //           ctx.fillStyle = "#ef4444";
  //           ctx.beginPath();
  //           ctx.arc(x, y, 5, 0, 2 * Math.PI);
  //           ctx.fill();
  //         }
  //       }
  //     },
  //     [segmentationMode]
  //   );

  //   const applyInteractiveSegmentation = useCallback(async () => {
  //     if (foregroundPoints.length === 0 && backgroundPoints.length === 0) return;

  //     onProcessingChange(true);
  //     setProgress(0);

  //     const progressInterval = setInterval(() => {
  //       setProgress((prev) => {
  //         if (prev >= 90) {
  //           clearInterval(progressInterval);
  //           return 90;
  //         }
  //         return prev + 10;
  //       });
  //     }, 200);

  //     // Simulate processing with user-defined points
  //     await new Promise((resolve) => setTimeout(resolve, 2000));

  //     clearInterval(progressInterval);
  //     setProgress(100);

  //     // Add interactive segmentation result
  //     const interactiveResult: SegmentationResult = {
  //       class: "Interactive Segmentation",
  //       confidence: 0.92,
  //       color: "#8b5cf6",
  //       visible: true,
  //     };

  //     setResults((prev) => [...prev, interactiveResult]);
  //     onProcessingChange(false);

  //     // Reset segmentation mode
  //     setSegmentationMode("none");
  //   }, [foregroundPoints, backgroundPoints, onProcessingChange]);

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
            setSegmentationMode(
              segmentationMode === "foreground" ? "none" : "foreground"
            );
          }}
          className="flex flex-1 flex-wrap"
        >
          {/* <div className="w-2 h-2 rounded-full bg-green-500 mr-1" /> */}
          ROI ({foregroundPoints.length})
        </Button>
        <Button
          size="sm"
          variant={segmentationMode === "background" ? "default" : "outline"}
          onClick={() => {
            setSegmentationMode(
              segmentationMode === "background" ? "none" : "background"
            );
          }}
          className="flex flex-1"
        >
          {/* <div className="w-2 h-2 rounded-full bg-red-500 mr-1" /> */}
          Background ({backgroundPoints.length})
        </Button>
      </div>

      {(foregroundPoints.length > 0 || backgroundPoints.length > 0) && (
        <Button
          size="sm"
          //   onClick={applyInteractiveSegmentation}
          //   disabled={isProcessing}
          className="w-full mt-3"
        >
          <Play className="h-3 w-3 mr-2" />
          Apply Segmentation
        </Button>
      )}
    </Card>
  );
}
