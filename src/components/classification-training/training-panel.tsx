"use client";

import { cn } from "@/lib/utils";

import type React from "react";
import { useState, useCallback, useEffect, useRef } from "react";
import { Card } from "@/components/shadcn-ui/card";
import { Button } from "@/components/shadcn-ui/button";
import { Progress } from "@/components/shadcn-ui/progress";
import { Label } from "@/components/shadcn-ui/label";
import { Slider } from "@/components/shadcn-ui/slider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn-ui/tabs";
import {
  Play,
  Square,
  Upload,
  Settings,
  BarChart3,
  Database,
  AlertCircle,
  CheckCircle,
  Pause,
} from "lucide-react";
import { LossVisualization, TrainingMetrics } from "./loss-visualization";
import { NVImage, Niivue } from "@niivue/niivue";
import { MriData } from "./mri";
import { classificationModels } from "@/components/segmentation-inference/model-selector";
import { ClassificationModel } from "@/model/classificationModel";
import { toast } from "sonner";
import ImageUploader from "@/components/segmentation-inference/image-uploader";
import ImageCanvas from "@/components/segmentation-inference/image-canvas";
import { ImageFile } from "@/components/segmentation-inference/inference-panel";
interface TrainingConfig {
  epochs: number;
  batchSize: number;
  maxSample: number;
}

interface TrainingSession {
  id: string;
  model: ClassificationModel | null;
  status:
    | "unavailable"
    | "loading"
    | "ready"
    | "running"
    | "paused"
    | "completed"
    | "failed";
  config: TrainingConfig;
  metrics: TrainingMetrics[];
  startTime: string;
  endTime?: string;
  currentEpoch: number;
  totalEpochs: number;
}

const nvTraining = new Niivue({
  loadingText:
    "Add training images from the button above. Make sure your file names include 'yes-lesion' or 'no-lesion'.",
  dragAndDropEnabled: false,
  textHeight: 0.2,
  backColor: [0, 0, 0, 1],
  crosshairColor: [244, 243, 238, 0.5],
  multiplanarForceRender: false,
});

export default function ClassificationTrainingPanel() {
  const nvRef = useRef<Niivue | null>(nvTraining);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<TrainingConfig>({
    epochs: 50,
    batchSize: 32,
    maxSample: 10,
  });
  const [session, setSession] = useState<TrainingSession>({
    id: crypto.randomUUID(),
    model: null,
    status: "unavailable",
    config: { ...config },
    metrics: [],
    startTime: new Date().toISOString(),
    currentEpoch: 0,
    totalEpochs: config.epochs,
  });
  const [trainingData, setTrainingData] = useState<ImageFile[]>([]);
  const [validationData, setValidationData] = useState<ImageFile[]>([]);
  const [numberOfTrainSamples, setNumberOfTrainSamples] = useState<number>(0);
  const [numberOfValidationSamples, setNumberOfValidationSamples] =
    useState<number>(0);

  const loadTrainingSession = async (): Promise<ClassificationModel | null> => {
    const modelMetadata = classificationModels.find(
      (m) => m.id === "aphasia-classifier"
    );
    if (!modelMetadata) {
      console.error("Model metadata not found");
      return null;
    }

    try {
      const model = new ClassificationModel(modelMetadata);
      setSession((prev) => ({
        ...prev,
        status: "loading",
      }));
      console.log("Initializing model...");
      const elapsed = await model.init(true, "training");
      console.log(`Model initialized in ${elapsed} ms`);
      return model;
    } catch (error) {
      console.error("Error initializing model:", error);
      return null;
    }
  };

  useEffect(() => {
    const loadIfUnavailable = async () => {
      if (session?.status === "unavailable") {
        const model = await loadTrainingSession();
        setSession((prev) => ({
          ...prev,
          model: model,
          status: model ? "ready" : "failed",
        }));
      }
    };
    loadIfUnavailable();
  }, [session?.status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const nv = nvRef.current;
    if (!canvas) return;
    if (!nv) return;
    nv.attachToCanvas(canvas);
    nv.setSliceType(0); // Default to axial if viewMode is invalid;
  }, [numberOfTrainSamples]);

  const startTraining = useCallback(async () => {
    if (
      !session ||
      session.status === "loading" ||
      session.status === "unavailable" ||
      !session.model
    )
      return;
    if (config.maxSample < trainingData.length) {
      toast.error(
        `Max training samples (${config.maxSample}) is less than the number of training files (${trainingData.length}). Please increase max samples or reduce training files.`
      );
      return;
    }
    setSession((prev) => ({
      id: prev ? prev.id : crypto.randomUUID(),
      model: prev.model,
      status: "running",
      config: { ...config },
      metrics: [],
      startTime: new Date().toISOString(),
      currentEpoch: 0,
      totalEpochs: config.epochs,
    }));

    const trainingNVImage: NVImage[] =
      nvRef.current?.volumes.filter((nvimage) =>
        trainingData.some((imageFile) => imageFile.id === nvimage.id)
      ) || [];
    const validationNVImage: NVImage[] =
      nvRef.current?.volumes.filter((nvimage) =>
        validationData.some((imageFile) => imageFile.id === nvimage.id)
      ) || [];

    const dataset = new MriData(
      config.batchSize,
      config.maxSample,
      config.maxSample
    );
    dataset.loadImages(trainingNVImage, validationNVImage);

    // Get lesion stats for a specific image
    const stats = MriData.getLesionStats(trainingNVImage[0]);
    console.log("Lesion voxel count:", stats.voxelCount);
    console.log("Lesion volume (mm³):", stats.volumeMm3);
    console.log(
      "Percentage affected:",
      stats.percentageAffected.toFixed(2) + "%"
    );

    const startTrainingTime = Date.now();
    const numEpochs = config.epochs;
    let itersPerSecCumulative = 0;
    let testAcc = 0;
    setSession((prev) => ({
      ...prev,
      status: "running",
    }));
    for (let epoch = 0; epoch < numEpochs; epoch++) {
      let epochLoss = 0;
      let epochAccuracy = 0;
      let epochValLoss = 0;
      let epochValAccuracy = 0;
      // Get batches
      for (const batch of dataset.trainingBatches()) {
        console.log(batch.features.dims); // [32, 1]
        console.log(batch.labels.dims); // [32, 4]
        const { loss, predictions, accuracy, perTestAccuracies } =
          await session.model!.trainStep(batch);
        console.log(`Epoch ${epoch + 1}, Loss: ${loss.toFixed(4)}`);
        epochLoss += loss;
        epochAccuracy += accuracy;
      }
      // Run testing epoch
      for (const batch of dataset.testingBatches()) {
        const { loss, predictions, accuracy } =
          await session.model!.evalStep(batch);
        epochValLoss += loss;
        epochValAccuracy += accuracy;
      }
      // Update session metrics
      epochLoss /= config.batchSize;
      epochAccuracy /= config.batchSize;
      setSession((prev) => {
        const newMetrics: TrainingMetrics[] = [
          ...prev.metrics,
          {
            epoch: epoch + 1,
            loss: epochLoss,
            accuracy: epochAccuracy,
            valLoss: epochValLoss,
            valAccuracy: epochValAccuracy,
          },
        ];
        return {
          ...prev,
          currentEpoch: epoch + 1,
          metrics: newMetrics,
        };
      });
    }
    const trainingTimeMs = Date.now() - startTrainingTime;
  }, [trainingData, config]);

  const pauseTraining = useCallback(() => {
    setSession((prev) => ({ ...prev, status: "paused" }));
  }, []);

  const resumeTraining = useCallback(() => {
    setSession((prev) => ({ ...prev, status: "running" }));
  }, []);

  const stopTraining = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      status: "completed",
      endTime: new Date().toISOString(),
    }));
  }, []);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, type = "training") => {
      const files = Array.from(event.target.files || []);
      if (!nvRef.current) return;
      const nv = nvRef.current;
      console.log("Uploading training data files:", files);
      try {
        files.forEach(async (file) => {
          const nvimage = await NVImage.loadFromFile({
            file: file,
          });
          // console.log("nv", nv, nvimage);

          nv.addVolume(nvimage);
          const newImage = {
            id: nvimage.id,
            name: nvimage.name,
            file: file,
            selected: false,
          };
          if (type === "training") {
            setTrainingData((prev) => [...prev, ...[newImage]]);
          } else {
            setValidationData((prev) => [...prev, ...[newImage]]);
          }
        });
      } catch (error) {
        toast.error(
          "Error loading image file(s). Please ensure they are valid NIfTI files."
        );
        console.error("Error loading image file(s):", error);
      }
      setNumberOfTrainSamples(files.length);
    },
    []
  );

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-blue-400";
      case "paused":
        return "text-yellow-400";
      case "completed":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "unavailable":
        return <Settings className="h-4 w-4" />;
      case "loading":
        return <Settings className="h-4 w-4 animate-spin" />;
      case "ready":
        return <CheckCircle className="h-4 w-4" />;
      case "running":
        return <Play className="h-4 w-4" />;
      case "paused":
        return <Pause className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "failed":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Square className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-primary/10 border-primary/20">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-primary" />
          <div>
            <h4 className="font-medium text-foreground">
              Classification Model Training
            </h4>
            <p className="text-sm text-muted-foreground">
              Train custom classification models on segmented medical image
              regions
            </p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <div
            className="grid grid-cols-1 lg:grid-cols-5 gap-6"
            style={{ gridTemplateColumns: "3fr 2fr" }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5" />
                Training Data
              </h3>

              <div className="space-y-4">
                {numberOfTrainSamples == 0 && (
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload training images with label in file name (e.g.,
                      "subject1_Broca.nii")
                    </p>
                    <Button
                      onClick={() =>
                        document.getElementById("training-upload")?.click()
                      }
                    >
                      Select Training Data
                    </Button>
                    <input
                      id="training-upload"
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}

                {numberOfTrainSamples > 0 && (
                  <div className="space-y-2">
                    <div className="flex-1 overflow-hidden">
                      <div
                        ref={containerRef}
                        className="niivue-canvas w-full relative bg-[#111]"
                      >
                        <canvas ref={canvasRef}></canvas>
                      </div>
                    </div>
                    <div className="overflow-y-scroll space-y-1">
                      {trainingData.map(
                        (file, index) =>
                          index < 10 && (
                            <div
                              key={file.id}
                              className="text-md text-black/80"
                            >
                              {file.name}
                            </div>
                          )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Training Parameters
                </h3>
              </div>

              {session && (
                <div
                  className={cn(
                    "flex items-center gap-2",
                    getStatusColor(session.status)
                  )}
                >
                  {getStatusIcon(session.status)}
                  <span className="text-sm capitalize">{session.status}</span>
                </div>
              )}

              {session.status !== "running" && (
                <div className="space-y-4">
                  <div>
                    <span className="font-medium text-sm">Training Data:</span>
                    <p className="text-muted-foreground font-medium text-sm">
                      {trainingData.length} files
                    </p>
                  </div>

                  <div>
                    <Label>Epochs: {config.epochs}</Label>
                    <Slider
                      value={[config.epochs]}
                      onValueChange={([value]) =>
                        setConfig((prev) => ({ ...prev, epochs: value }))
                      }
                      max={200}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Batch Size: {config.batchSize}</Label>
                    <Slider
                      value={[config.batchSize]}
                      onValueChange={([value]) =>
                        setConfig((prev) => ({ ...prev, batchSize: value }))
                      }
                      max={128}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Max training samples: {config.maxSample}</Label>
                    <Slider
                      value={[config.maxSample]}
                      onValueChange={([value]) =>
                        setConfig((prev) => ({ ...prev, maxSample: value }))
                      }
                      max={1000}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <Button
                    onClick={startTraining}
                    disabled={trainingData.length === 0 || !session.model}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Training
                  </Button>
                </div>
              )}

              {session && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Epoch:</span>
                      <p className="font-medium">
                        {session.currentEpoch} / {session.totalEpochs}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Progress:</span>
                      <p className="font-medium">
                        {(
                          (session.currentEpoch / session.totalEpochs) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <p className="font-medium capitalize">{session.status}</p>
                    </div>
                  </div>

                  <Progress
                    value={(session.currentEpoch / session.totalEpochs) * 100}
                    className="h-2"
                  />

                  <div className="flex gap-2">
                    {session.status === "running" && (
                      <>
                        <Button onClick={pauseTraining} variant="outline">
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                        <Button onClick={stopTraining} variant="destructive">
                          <Square className="h-4 w-4 mr-2" />
                          Stop
                        </Button>
                      </>
                    )}

                    {session.status === "paused" && (
                      <Button onClick={resumeTraining}>
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}

                    {(session.status === "completed" ||
                      session.status === "failed") && (
                      <Button
                        onClick={() =>
                          setSession({
                            id: crypto.randomUUID(),
                            model: null,
                            status: "unavailable",
                            config: { ...config },
                            metrics: [],
                            startTime: new Date().toISOString(),
                            currentEpoch: 0,
                            totalEpochs: config.epochs,
                          })
                        }
                        variant="outline"
                      >
                        New Training Session
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Validation Data Upload Card  */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5" />
                Validation Data
              </h3>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload validation images and labels
                  </p>
                  <Button
                    onClick={() =>
                      document.getElementById("validation-upload")?.click()
                    }
                  >
                    Select Validation Data
                  </Button>
                  <input
                    id="validation-upload"
                    type="file"
                    multiple
                    onChange={(e) => handleFileUpload(e, "validation")}
                    className="hidden"
                  />
                </div>

                {validationData.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {validationData.length} files selected
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {validationData.length > 10 && (
                        <div className="text-xs text-muted-foreground">
                          ... and {validationData.length - 10} more files
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          {session && session.metrics.length > 0 ? (
            <LossVisualization metrics={session.metrics} />
          ) : (
            <Card className="p-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Training Data
              </h3>
              <p className="text-muted-foreground">
                Start a training session to see real-time metrics and loss
                visualization.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
