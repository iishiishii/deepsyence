"use client";

import type React from "react";

import { useState, useCallback, useEffect, useRef } from "react";
import { Brain, Star } from "lucide-react";
import { Card } from "@/components/shadcn-ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/shadcn-ui/badge";
import { ImageModel } from "@/model/imageModel";
import { toast } from "sonner";
import { UnetModel } from "@/model/unetModel";
import { SegmentAnythingModel } from "@/model/samModel";
import { on } from "events";

export enum ModelType {
  Unknown = 1,
  Unet,
  SegmentAnything,
}

export type ModelMetadata = {
  id: string;
  memEstimateMB: number;
  title?: string;
  description?: string;
  sizeMB: number;
  tags?: string[];
  referenceURL?: string;
  type?: ModelType;
  modelPaths: Map<string, string>;
  configPath?: string;
  preprocessorPath: string;
  examples?: string[];
};

export const segmentationModels: ModelMetadata[] = [
  {
    id: "efficient-sam",
    title: "Efficient SAM quantized",
    description:
      "Interactive image segmentation model optimized for efficiency. Once it finishes inferencing, you can click on the image to segment objects.",
    memEstimateMB: 2600,
    type: ModelType.SegmentAnything,
    sizeMB: 45,
    configPath:
      "https://web-ai-models.org/image/feature-extraction/EfficientFormer/config.json",
    modelPaths: new Map<string, string>([
      [
        "encoder",
        "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/efficient_sam_vitt_encoder.onnx",
      ],
      [
        "decoder",
        "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/efficient_sam_vitt_decoder.onnx",
      ],
    ]),
    preprocessorPath:
      "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/efficient-sam-preprocess.json",
    tags: ["efficient-sam"],
    referenceURL: "https://github.com/yformer/EfficientSAM",
  },
  {
    id: "litemed-sam",
    title: "LiteMedSAM",
    description:
      "Lightweight segmentation model finetuned on medical images. Once it finishes inferencing, you can click on the image to segment objects.",
    memEstimateMB: 2600,
    type: ModelType.SegmentAnything,
    sizeMB: 45,
    configPath:
      "https://web-ai-models.org/image/feature-extraction/EfficientFormer/config.json",
    modelPaths: new Map<string, string>([
      [
        "encoder",
        "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/litemedsam_encoder.onnx",
      ],
      [
        "decoder",
        "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/litemedsam_decoder.onnx",
      ],
    ]),
    preprocessorPath:
      "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/lite-medsam-preprocess.json",
    tags: ["litemed-sam"],
    referenceURL: "https://github.com/bowang-lab/MedSAM/tree/LiteMedSAM",
  },
  {
    id: "sam-quantized",
    title: "SAM quantized",
    description:
      "Interactive image segmentation model with less parameters. Once it finishes inferencing, you can click on the image to segment objects.",
    memEstimateMB: 2600,
    type: ModelType.SegmentAnything,
    sizeMB: 105,
    configPath:
      "https://web-ai-models.org/image/feature-extraction/EfficientFormer/config.json",
    modelPaths: new Map<string, string>([
      [
        "encoder",
        "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/sam_encoder_quant.onnx",
      ],
      [
        "decoder",
        "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/sam_decoder_quant.onnx",
      ],
    ]),
    preprocessorPath:
      "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/segmen-anything-preprocess.json",
    tags: ["sam-quantized"],
    referenceURL: "https://huggingface.co/visheratin/segment-anything-vit-b",
  },
  {
    id: "unet-gw-segmentation",
    title: "UNET GW segmentation",
    description:
      "Non-interactive finetuned UNET model for gray-white matter segmentation.",
    memEstimateMB: 2600,
    type: ModelType.Unet,
    sizeMB: 10,
    configPath:
      "https://web-ai-models.org/image/feature-extraction/EfficientFormer/config.json",
    modelPaths: new Map<string, string>([
      [
        "model",
        "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/unet_gw_segmentation.onnx",
      ],
    ]),
    preprocessorPath:
      "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/unet-gw-preprocess.json",
    tags: ["unet-gw-segmentation"],
    referenceURL: "https://huggingface.co/visheratin/segment-anything-vit-b",
  },
];

interface ModelData {
  metadata: ModelMetadata | null;
  instance: SegmentAnythingModel | null;
}

interface ModelSelectorProps {
  selectedModel: ModelMetadata | null;
  onSelectModel: (data: ModelData) => void;
  onSetModelReady: (ready: boolean) => void;
}

export default function ModelSelector({
  selectedModel,
  onSelectModel,
  onSetModelReady,
}: ModelSelectorProps) {
  // Add local state for visual selection
  const [visuallySelectedModel, setVisuallySelectedModel] = useState<ModelMetadata | null>(selectedModel);

  const getSizeColor = (size: number) => {
    switch (true) {
      case size < 20:
        return "bg-green-500/20 text-green-400";
      case size < 50:
        return "bg-yellow-500/20 text-yellow-400";
      case size < 100:
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const handleSelectModel = useCallback(async (selectedModel: ModelMetadata) => {
    // Set visual selection immediately
    setVisuallySelectedModel(selectedModel);
    onSetModelReady(false);
    try {
      // Initialize the model and wait for it to be ready
      await ImageModel.create(selectedModel.id).then(({ model, elapsed }) => {
        console.log(`Model ${model} initialized in ${elapsed} ms`);
        onSelectModel({
          metadata: selectedModel,
          instance: model,
        });
        onSetModelReady(model !== null);
      });
    } catch (error) {
      console.error("Error selecting model:", error);
      toast("Error selecting model:" + error);
      // Reset visual selection on error
      setVisuallySelectedModel(null);
    }
  }, [selectedModel]);

  return (
    <div className="space-y-6">
      {segmentationModels.map((model) => (
        <div
          key={model.id}
          className={cn(
            "p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm",
            // Use visuallySelectedModel instead of selectedModel
            visuallySelectedModel?.id === model.id &&
            "ring-2 ring-primary bg-primary/5"
          )}
          onClick={() => handleSelectModel(model)}
        >
          <div className="flex items-start gap-2">
            <Brain className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm">{model.title}</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {model.description}
              </p>
              <div className="flex items-center justify-between mt-2">
                <Badge className={cn("text-xs", getSizeColor(model.sizeMB))}>
                  {model.sizeMB}MB
                </Badge>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}