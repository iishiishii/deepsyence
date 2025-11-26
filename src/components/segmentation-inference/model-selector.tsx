"use client";

import type React from "react";

import { useState, useCallback, useEffect, useRef } from "react";
import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/shadcn-ui/badge";
import { ImageModel } from "@/model/imageModel";
import { toast } from "sonner";
import { UnetModel } from "@/model/unetModel";
import { SegmentAnythingModel } from "@/model/samModel";
import { ScrollArea } from "@/components/shadcn-ui/scroll-area";

export enum ModelType {
  Unknown = 1,
  Unet,
  SegmentAnything,
  Classification,
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
  preprocessorPath: string;
  examples?: string[];
  lossNodeName?: string;
};

export const segmentationModels: ModelMetadata[] = [
  {
    id: "efficient-sam",
    title: "Efficient SAM quantized",
    description:
      "Interactive image segmentation model optimized for efficiency.",
    memEstimateMB: 2600,
    type: ModelType.SegmentAnything,
    sizeMB: 40,
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
  },
  {
    id: "litemed-sam",
    title: "LiteMedSAM",
    description: "Lightweight segmentation model finetuned on medical images.",
    memEstimateMB: 2600,
    type: ModelType.SegmentAnything,
    sizeMB: 42,
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
    description: "Interactive image segmentation model with less parameters.",
    memEstimateMB: 2600,
    type: ModelType.SegmentAnything,
    sizeMB: 100,
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
];

export const classificationModels: ModelMetadata[] = [
  {
    id: "aphasia-classifier",
    title: "Aphasia Classifier",
    description:
      "MLP classifier trained to predict aphasia type from lesion masks.",
    memEstimateMB: 2600,
    type: ModelType.Classification,
    sizeMB: 0.08,
    modelPaths: new Map<string, string>([
      ["inference", "./model/aphasia_classifier.onnx"],
      ["checkpoint", "./model/aphasia_classifier/checkpoint"],
      ["training", "./model/aphasia_classifier/training_model.onnx"],
      ["optimizer", "./model/aphasia_classifier/optimizer_model.onnx"],
      ["eval", "./model/aphasia_classifier/eval_model.onnx"],
    ]),
    preprocessorPath:
      "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/efficient-sam-preprocess.json",
    tags: ["aphasia-classifier"],
    lossNodeName: "onnx::reducemean_output::23",
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
  const [visuallySelectedModel, setVisuallySelectedModel] =
    useState<ModelMetadata | null>(selectedModel);

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

  const handleSelectModel = useCallback(
    async (selectedModel: ModelMetadata) => {
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
    },
    [selectedModel]
  );

  return (
    // <div className="flex flex-col h-full">
    <ScrollArea className="h-full space-y-6">
      {segmentationModels.map((model) => (
        <div
          key={model.id}
          className={cn(
            "m-3 p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm",
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
    </ScrollArea>
    // </div>
  );
}
