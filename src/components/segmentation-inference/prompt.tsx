"use client";

import { Card } from "@/components/shadcn-ui/card";
import { MousePointer2, Square } from "lucide-react";
import { Button } from "@/components/shadcn-ui/button";

interface SamDecoderProps {
  // model: UnetModel | SegmentAnythingModel | null;
  segmentationMode: "foreground" | "background" | "box" | "none";
  onSetSegmentationMode: (
    mode: "none" | "foreground" | "background" | "box"
  ) => void;
}

export default function SamDecoder({
  segmentationMode,
  onSetSegmentationMode,
}: SamDecoderProps) {
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
            onSetSegmentationMode("foreground");
          }}
          className="flex flex-1"
        >
          <div className="w-2 h-2 rounded-full bg-green-500 mr-1 items-center" />
          <div className="text-xs flex flex-col items-center">
            Add
            <br />
            mask
          </div>
        </Button>
        <Button
          size="sm"
          variant={segmentationMode === "background" ? "default" : "outline"}
          onClick={() => {
            onSetSegmentationMode("background");
          }}
          className="flex flex-1"
        >
          <div className="w-2 h-2 rounded-full bg-red-500 mr-1" />
          <div className="text-xs">
            Remove
            <br />
            area
          </div>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        Use right click to draw a box around the region for refined segmentation
      </p>
      <div className="flex flex-row items-center">
        <Button
          size="sm"
          variant={segmentationMode === "box" ? "default" : "outline"}
          onClick={() => {
            onSetSegmentationMode("box");
          }}
          className="flex flex-1"
        >
          <Square className="h-3 w-3 mr-1" />
          <div className="text-xs">
            Draw
            <br />
            Box
          </div>
        </Button>
      </div>
    </Card>
  );
}
