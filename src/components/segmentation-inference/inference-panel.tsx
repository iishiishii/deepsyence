"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PanelLeft, PanelRight } from "lucide-react";
import { Button } from "@/components/shadcn-ui/button";
import { Card } from "@/components/shadcn-ui/card";
import { Download, Play, Square } from "lucide-react";
import { Badge } from "@/components/shadcn-ui/badge";
import { Progress } from "@/components/shadcn-ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs";
import { ScrollArea } from "@/components/shadcn-ui/scroll-area";
import { cn } from "@/lib/utils";
import { Niivue, NVImage } from "@niivue/niivue";
import ImageUploader from "@/components/segmentation-inference/image-uploader";
import ImageCanvas from "@/components/segmentation-inference/image-canvas";
import ImageList from "@/components/segmentation-inference/image-list";
import ModelSelector, { ModelMetadata } from "@/components/segmentation-inference/model-selector";
import SamDecoder from "@/components/segmentation-inference/interactive-segmentation";
import { toast } from "sonner";
import { UnetModel } from "@/model/unetModel";
import { SegmentAnythingModel } from "@/model/samModel";
import { nvDrawMask } from "@/helpers/niivueHandler";

export type ImageFile = {
  id: string;
  name: string;
  file: File;
  selected: boolean;
};

export const nv = new Niivue({
  dragAndDropEnabled: false,
  textHeight: 0.02,
  backColor: [0, 0, 0, 1],
  crosshairColor: [244, 243, 238, 0.5],
  multiplanarForceRender: false,
});

export default function InferencePanel() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(
    null
  );
  const [progress, setProgress] = useState(0);
  const [modelReady, setModelReady] = useState(false);
  // const [results, setResults] = useState<Uint8Array>(new Uint8Array());
  const [selectedModel, setSelectedModel] = useState<
    SegmentAnythingModel | null
  >(null);
  const [modelMetadata, setModelMetadata] = useState<ModelMetadata | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [segmentationMode, setSegmentationMode] = useState<
    "none" | "foreground" | "background" | "box"
  >("none");
  const nvRef = useRef<Niivue | null>(nv);

  let handleIntensityChange = (data: any) => {
    document.getElementById("intensity")!.innerHTML =
      data.vox[0] +
      "×" +
      data.vox[1] +
      "×" +
      data.vox[2] +
      " = " +
      data.values[0].value.toFixed(2);
  };

  // Add uploaded files to Niivue
  let handleFileUpload = async (files: File[]) => {
    if (!nvRef.current) return;
    const nv = nvRef.current;
    nv.onLocationChange = handleIntensityChange;
    try {
      files.forEach(async (file) => {
        const nvimage = await NVImage.loadFromFile({
          file: file,
        });
        console.log("nv", nv);

        nv.addVolume(nvimage);

        const newImage = {
          id: nvimage.id,
          name: nvimage.name,
          file: file,
          selected: false,
        };
        setImages((prev) => [...prev, ...[newImage]]);
      });
    } catch (error) {
      toast.error("Error loading image file(s). Please ensure they are valid NIfTI files.");
      console.error("Error loading image file(s):", error);
    }
    console.log("nv volumes", files.length);
    setCurrentImageIndex(0);
  };

  const handleVisibility = (id: number) => {
    setCurrentImageIndex(id);
    images.map((img, index) => {
      console.log("img", img, "index", index, "id", id);
      if (index === id) {
        nv.setOpacity(nv.getVolumeIndexByID(img.id), 1);
      } else {
        nv.setOpacity(nv.getVolumeIndexByID(img.id), 0);
      }
    });
    nv.updateGLVolume();
  };

  const drawMask = (mask: Uint8Array, suffix: string) => {
    if (!nvRef.current || currentImageIndex === null) return;

    nvDrawMask(
      nvRef.current,
      images[currentImageIndex].id,
      images[currentImageIndex].name + suffix,
      mask
    );
  };

  const runInference = useCallback(async () => {
    if (!modelMetadata || !selectedModel || currentImageIndex === null) return;
    if (!nvRef.current) return;
    const image = nvRef.current.volumes[currentImageIndex];
    if (!image) return;

    setIsProcessing(true);
    setProgress(0);
    // setResults(new Uint8Array());

    // const progressInterval = setInterval(() => {
    //   setProgress((prev) => {
    //     if (prev >= 90) {
    //       clearInterval(progressInterval);
    //       return 90;
    //     }
    //     return prev + 10;
    //   });
    // }, 200);
    console.log("start inference with model:", selectedModel);
    // if (selectedModel instanceof UnetModel) {
    //   setProgress(5); // Start progress bar
    //   try {
    //     const result = await selectedModel.process(image); // T_heavy: Actual work

    //     if (!result) throw Error("No result from model encoder");
    //     drawMask(result, "_unet");
    //     // setResults(result);
    //     setProgress(100);
    //     toast("Embedding loaded");
    //   } catch (error) {
    //     toast(`Unet error ${error}`);
    //     console.log("error unet", error);
    //   }
    // } else {
    // SamModel Encoder Loop
    // Use a single progress update at the start of the loop
    // const start = 0;
    // const end = image.dims![3];
    const start = 100;
    const end = 102;
    console.log("processing slices ", start, end);
    const totalSteps = end - start || 1; // Avoid division by zero
    const progressPerStep = 100 / totalSteps; // Reserve 10% for final cleanup

    try {
      // check getVolumeData()
      // https://github.com/niivue/niivue/blob/main/packages/niivue/src/nvimage/index.ts#L3597
      for (let i = start; i < end; i++) {
        await selectedModel.process(image, i); // T_heavy: Actual work
        // Update progress based on completed step
        setProgress((prev) => prev + progressPerStep);
      }
      // const result = selectedModel.encoderResultCache;
      // if (!result) throw Error("No result from model encoder");
      // setResults(result[0].data as Uint8Array);
      // Finalize after the loop
      setProgress(100);
      toast("Embedding loaded");
      // ... setBbox and other cleanup ...
    } catch (error) {
      toast(`Encoder ${error}`);
      console.log("error encoder", error);
    }
    // }

    // clearInterval(progressInterval);
    setProgress(100);

    setIsProcessing(false);
  }, [modelMetadata, currentImageIndex, setIsProcessing]);

  const stopInference = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
  }, [setIsProcessing]);

  const handleModelSelection = (data: {
    metadata: ModelMetadata | null;
    instance: SegmentAnythingModel | null;
  }) => {
    // 1. Store the metadata (for the selector component)
    setModelMetadata(data.metadata);
    // 2. Store the actual initialized model instance (for segmentation logic)
    setSelectedModel(data.instance);
    selectedModel?.dispose(); // Dispose of previous model if any
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Model Selection & Inference</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <PanelRight className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
              <span className="ml-2 sr-only md:not-sr-only md:inline-block">
                {sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
              </span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <main className="flex-1">
          <div className="flex h-full flex-col">
            {currentImageIndex === null ? (
              <div className="flex h-full items-center justify-center">
                <ImageUploader onUpload={handleFileUpload} />
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <ImageCanvas nvRef={nvRef} onFileUpload={handleFileUpload} segmentationMode={segmentationMode} selectedModel={selectedModel as SegmentAnythingModel} drawMask={drawMask} />
              </div>
            )}
          </div>
        </main>

        {sidebarOpen && (
          <aside
            className={cn(
              "border-l bg-background w-80 overflow-scroll flex flex-col"
            )}
          >
            <Tabs defaultValue="images">
              <TabsList className="w-full justify-start border-b rounded-none px-2 h-12">
                <TabsTrigger
                  value="images"
                  className="data-[state=active]:bg-muted"
                >
                  Images
                </TabsTrigger>
                <TabsTrigger
                  value="tools"
                  className="data-[state=active]:bg-muted"
                >
                  Segmentation Models
                </TabsTrigger>
              </TabsList>

              <TabsContent value="images" className="flex-1 p-0">
                <ImageList
                  images={images}
                  currentImageIndex={currentImageIndex}
                  handleVisibility={handleVisibility}
                />
              </TabsContent>

              <TabsContent value="tools" className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <ModelSelector
                      selectedModel={modelMetadata}
                      onSelectModel={handleModelSelection}
                      onSetModelReady={setModelReady}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* <TabsContent value="history" className="flex-1 p-0">
                <ProcessingHistory
                  nvRef={nvRef}
                  onSetCurrentImageIndex={setCurrentImageIndex}
                  setImages={setImages}
                />
              </TabsContent> */}
            </Tabs>

            <div className="border-t p-4 bg-background">
              {/* Inference Controls */}
              <Card className="p-4 gap-2">
                <h3 className="font-semibold mb-2">Inference Control</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Image name:</span>
                    <p className="font-medium truncate">
                      {images.length === 0 || currentImageIndex === null
                        ? null
                        : images[currentImageIndex].file.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Image size:</span>
                    <p className="font-medium">
                      {images.length === 0 || currentImageIndex === null
                        ? null
                        : (
                          images[currentImageIndex].file.size /
                          1024 /
                          1024
                        ).toFixed(1)}{" "}
                      MB
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Model:</span>
                    <p className="font-medium">
                      {!modelMetadata ? "" : modelMetadata.title}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-row flex-wrap items-center gap-2 mb-3">
                    {!modelMetadata && !modelReady && (
                      <Badge variant="destructive">No Model</Badge>
                    )}
                    {currentImageIndex === null && (
                      <Badge variant="destructive">No Image</Badge>
                    )}
                    {modelMetadata && (
                      <Badge className="bg-green-500/20 text-green-400">
                        {modelReady ? "Ready" : "Loading..."}
                      </Badge>
                    )}
                  </div>

                  {isProcessing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      onClick={runInference}
                      disabled={
                        !modelMetadata ||
                        currentImageIndex === null ||
                        isProcessing ||
                        !modelReady
                      }
                      className="w-full flex items-center gap-2"
                      size="lg"
                    >
                      <Play className="h-4 w-4" />
                      {isProcessing ? "Processing..." : "Run Inference"}
                    </Button>

                    {isProcessing && (
                      <Button
                        onClick={stopInference}
                        variant="destructive"
                        className="w-full flex items-center gap-2"
                      >
                        <Square className="h-4 w-4" />
                        Stop
                      </Button>
                    )}

                    {!isProcessing && progress == 100 && (
                      <SamDecoder segmentationMode={segmentationMode} onSetSegmentationMode={setSegmentationMode} />
                    )}

                    {/* {results.length > 0 && (
                      <Button
                        variant="outline"
                        className="w-full flex items-center gap-2 bg-transparent"
                        onClick={() => {
                          const dataStr = JSON.stringify(results, null, 2);
                          const dataUri =
                            "data:application/json;charset=utf-8," +
                            encodeURIComponent(dataStr);
                          const link = document.createElement("a");
                          link.setAttribute("href", dataUri);
                          link.setAttribute(
                            "download",
                            `segmentation_results_${Date.now()}.json`
                          );
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Export Results
                      </Button>
                    )} */}
                  </div>
                </div>
              </Card>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
