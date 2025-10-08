"use client";

import type React from "react";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Brush, Eraser, PaintBucket } from "lucide-react";
import { Niivue } from "@niivue/niivue";

const annotationColors = [
  "#80AE80",
  "#F1D691",
  "#B17A65",
  "#6FB8D2",
  "#D8654F",
];

interface AnnotationProps {
  nvRef: React.RefObject<Niivue>;
  isAnnotating: boolean;
  onDrawFunction?: (drawFn: () => void) => void;
}
export default function Annotation({
  nvRef,
  isAnnotating,
  onDrawFunction,
}: AnnotationProps) {
  const [selectedColor, setSelectedColor] = useState(annotationColors[0]);
  const [brushSize, setBrushSize] = useState(5);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [isErasing, setIsErasing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFilling, setIsFilling] = useState(false);

  const draw = useCallback(() => {
    if ((!isDrawing && !isFilling && !isErasing) || !isAnnotating) return;
    if (!nvRef.current) return;

    const nv = nvRef.current;
    nv.setDrawingEnabled(true);

    if (isErasing) {
      nv.setPenValue(0);
    } else {
      const filled = isFilling ? true : false;
      const mode = annotationColors.indexOf(selectedColor) + 1;

      nv.opts.penSize = brushSize;
      nv.drawOpacity = brushOpacity;
      nv.setDrawColormap("$slicer3d");
      nv.setPenValue(mode, filled);
    }
  }, [
    isDrawing,
    isAnnotating,
    isErasing,
    isFilling,
    brushSize,
    brushOpacity,
    selectedColor,
  ]);

  // Pass the draw function to the parent component
  useEffect(() => {
    if (onDrawFunction) {
      onDrawFunction(draw);
    }
  }, [draw, onDrawFunction]);

  const stopDrawing = () => {
    if (!nvRef.current) return;

    setIsErasing(false);
    setIsDrawing(false);
    setIsFilling(false);
    const nv = nvRef.current;
    nv.setDrawingEnabled(false);
  };

  const clearAnnotations = useCallback(() => {
    if (!nvRef.current) return;

    const nv = nvRef.current;
    nv.closeDrawing();
  }, []);

  return (
    <div className="w-full">
      <Card className="mt-4 p-4 gap-2">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium">Annotation Tools</h4>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={clearAnnotations}>
              Clear All
            </Button>
            <Button size="sm" variant="outline" onClick={stopDrawing}>
              Close
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              variant={isDrawing ? "default" : "outline"}
              onClick={(e) => {
                e.stopPropagation();
                setIsErasing(false);
                setIsDrawing(true);
                setIsFilling(false);
              }}
            >
              <Brush className="h-3 w-3 mr-1" />
              Draw
            </Button>
            <Button
              size="sm"
              variant={isFilling ? "default" : "outline"}
              onClick={(e) => {
                e.stopPropagation();
                setIsErasing(false);
                setIsFilling(true);
                setIsDrawing(false);
              }}
            >
              <PaintBucket className="h-3 w-3 mr-1" />
              Fill
            </Button>
            <Button
              size="sm"
              variant={isErasing ? "default" : "outline"}
              onClick={(e) => {
                e.stopPropagation();
                setIsErasing(true);
                setIsFilling(false);
                setIsDrawing(false);
              }}
            >
              <Eraser className="h-3 w-3 mr-1" />
              Erase
            </Button>
          </div>

          <div className="flex justify-between gap-6 md:gap-8">
            {/* Colors */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Colors</Label>
              <div className="grid grid-cols-5 gap-2">
                {annotationColors.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded border-2 transition-all",
                      selectedColor === color
                        ? "border-primary scale-110"
                        : "border-border hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>

            {/* Brush Size */}
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">
                Brush Size: {brushSize}px
              </Label>
              <Slider
                value={[brushSize]}
                onValueChange={([value]) => setBrushSize(value)}
                max={20}
                min={1}
                step={1}
                className="w-full p-2"
              />
            </div>

            {/* Brush Opacity */}
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">
                Brush Opacity: {brushOpacity}
              </Label>
              <Slider
                value={[brushOpacity]}
                onValueChange={([value]) => setBrushOpacity(value)}
                max={1}
                min={0}
                step={0.05}
                className="w-full p-2"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
