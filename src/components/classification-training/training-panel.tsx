"use client"

import { cn } from "@/lib/utils"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { Card } from "@/components/shadcn-ui/card"
import { Button } from "@/components/shadcn-ui/button"
import { Progress } from "@/components/shadcn-ui/progress"
import { Label } from "@/components/shadcn-ui/label"
import { Slider } from "@/components/shadcn-ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs"
import { Play, Square, Upload, Settings, BarChart3, Database, AlertCircle, CheckCircle, Pause } from "lucide-react"
import { LossVisualization } from "./loss-visualization"
import { NVImage, Niivue } from "@niivue/niivue";
import { MriData } from './mri';

interface TrainingConfig {
  epochs: number
  batchSize: number
  learningRate: number
  optimizer: "adam" | "sgd" | "rmsprop"
  lossFunction: "categorical_crossentropy" | "binary_crossentropy" | "focal_loss"
  modelName: string
  lossNodeName: string
  description: string
}

interface TrainingMetrics {
  epoch: number
  loss: number
  accuracy: number
  valLoss: number
  valAccuracy: number
  learningRate: number
  timestamp: string
}

interface TrainingSession {
  id: string
  status: "idle" | "running" | "paused" | "completed" | "failed"
  config: TrainingConfig
  metrics: TrainingMetrics[]
  startTime: string
  endTime?: string
  currentEpoch: number
  totalEpochs: number
  estimatedTimeRemaining: number
}

const nvTraining = new Niivue({
    loadingText: "Add training images from the button above. Make sure your file names include 'yes-lesion' or 'no-lesion'.",
    dragAndDropEnabled: false,
    textHeight: 0.2,
    backColor: [0, 0, 0, 1],
    crosshairColor: [244, 243, 238, 0.5],
  });

export default function ClassificationTrainingPanel() {
  const [config, setConfig] = useState<TrainingConfig>({
    epochs: 50,
    batchSize: 32,
    learningRate: 0.001,
    optimizer: "adam",
    lossFunction: "categorical_crossentropy",
    modelName: "custom_classification_model",
    lossNodeName: "onnx::loss::8",
    description: "Custom medical image classification model",
  })

  const [session, setSession] = useState<TrainingSession | null>(null)
  const [trainingData, setTrainingData] = useState<File[]>([])
  const [validationData, setValidationData] = useState<File[]>([])

  useEffect(() => {
    if (session?.status === "running") {
      const interval = setInterval(() => {
        setSession((prev) => {
          if (!prev || prev.status !== "running") return prev

          const newEpoch = prev.currentEpoch + 1
          const isComplete = newEpoch >= prev.totalEpochs

          const newMetric: TrainingMetrics = {
            epoch: newEpoch,
            loss: Math.max(0.1, 2.0 - newEpoch * 0.03 + (Math.random() - 0.5) * 0.1),
            accuracy: Math.min(0.98, 0.3 + newEpoch * 0.012 + (Math.random() - 0.5) * 0.02),
            valLoss: Math.max(0.15, 2.2 - newEpoch * 0.025 + (Math.random() - 0.5) * 0.15),
            valAccuracy: Math.min(0.95, 0.25 + newEpoch * 0.01 + (Math.random() - 0.5) * 0.03),
            learningRate: prev.config.learningRate * Math.pow(0.95, Math.floor(newEpoch / 10)),
            timestamp: new Date().toISOString(),
          }

          return {
            ...prev,
            currentEpoch: newEpoch,
            metrics: [...prev.metrics, newMetric],
            status: isComplete ? "completed" : "running",
            endTime: isComplete ? new Date().toISOString() : undefined,
            estimatedTimeRemaining: isComplete ? 0 : (prev.totalEpochs - newEpoch) * 30000,
          }
        })
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [session?.status])

  const startTraining = useCallback(() => {
    const newSession: TrainingSession = {
      id: `training_${Date.now()}`,
      status: "running",
      config: { ...config },
      metrics: [],
      startTime: new Date().toISOString(),
      currentEpoch: 0,
      totalEpochs: config.epochs,
      estimatedTimeRemaining: config.epochs * 30000,
    }
    setSession(newSession)
  }, [config])

  const pauseTraining = useCallback(() => {
    setSession((prev) => (prev ? { ...prev, status: "paused" } : null))
  }, [])

  const resumeTraining = useCallback(() => {
    setSession((prev) => (prev ? { ...prev, status: "running" } : null))
  }, [])

  const stopTraining = useCallback(() => {
    setSession((prev) =>
      prev
        ? {
            ...prev,
            status: "completed",
            endTime: new Date().toISOString(),
          }
        : null,
    )
  }, [])

  const handleTrainingDataUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setTrainingData(files)
  }, [])

  const handleValidationDataUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setValidationData(files)
  }, [])

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-blue-400"
      case "paused":
        return "text-yellow-400"
      case "completed":
        return "text-green-400"
      case "failed":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Play className="h-4 w-4" />
      case "paused":
        return <Pause className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "failed":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Square className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-primary/10 border-primary/20">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-primary" />
          <div>
            <h4 className="font-medium text-foreground">Classification Model Training</h4>
            <p className="text-sm text-muted-foreground">
              Train custom classification models on segmented medical image regions
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
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6"  style={{ gridTemplateColumns: "3fr 2fr" }}>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5" />
                Training Data
              </h3>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4"/>
                  <p className="text-sm text-muted-foreground mb-4">Upload training images and labels</p>
                  <Button onClick={() => document.getElementById("training-upload")?.click()}>
                    Select Training Data
                  </Button>
                  <input
                    id="training-upload"
                    type="file"
                    multiple
                    onChange={handleTrainingDataUpload}
                    className="hidden"
                  />
                </div>

                {trainingData.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{trainingData.length} files selected</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {trainingData.slice(0, 10).map((file, index) => (
                        <div key={index} className="text-xs text-muted-foreground truncate">
                          {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                        </div>
                      ))}
                      {trainingData.length > 10 && (
                        <div className="text-xs text-muted-foreground">
                          ... and {trainingData.length - 10} more files
                        </div>
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
                <div className={cn("flex items-center gap-2", getStatusColor(session.status))}>
                  {getStatusIcon(session.status)}
                  <span className="text-sm capitalize">{session.status}</span>
                </div>
              )}

            {!session && (
              <div className="space-y-4">
                <div>
                    <span className="font-medium text-sm">Training Data:</span>
                    <p className="text-muted-foreground font-medium text-sm">{trainingData.length} files</p>
                </div>
                
                <div>
                  <Label>Epochs: {config.epochs}</Label>
                  <Slider
                    value={[config.epochs]}
                    onValueChange={([value]) => setConfig((prev) => ({ ...prev, epochs: value }))}
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
                    onValueChange={([value]) => setConfig((prev) => ({ ...prev, batchSize: value }))}
                    max={128}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Learning Rate: {config.learningRate}</Label>
                  <Slider
                    value={[config.learningRate]}
                    onValueChange={([value]) => setConfig((prev) => ({ ...prev, learningRate: value }))}
                    max={0.1}
                    min={0.0001}
                    step={0.0001}
                    className="mt-2"
                  />
                </div>

                <Button onClick={startTraining} disabled={trainingData.length === 0} className="w-full">
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
                    <p className="font-medium">{((session.currentEpoch / session.totalEpochs) * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time Remaining:</span>
                    <p className="font-medium">{formatTime(session.estimatedTimeRemaining)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-medium capitalize">{session.status}</p>
                  </div>
                </div>

                <Progress value={(session.currentEpoch / session.totalEpochs) * 100} className="h-2" />

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

                  {(session.status === "completed" || session.status === "failed") && (
                    <Button onClick={() => setSession(null)} variant="outline">
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
                  <p className="text-sm text-muted-foreground mb-4">Upload validation images and labels</p>
                  <Button onClick={() => document.getElementById("validation-upload")?.click()}>
                    Select Validation Data
                  </Button>
                  <input
                    id="validation-upload"
                    type="file"
                    multiple
                    accept="image/*,.json,.csv"
                    onChange={handleValidationDataUpload}
                    className="hidden"
                  />
                </div>

                {validationData.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{validationData.length} files selected</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {validationData.slice(0, 10).map((file, index) => (
                        <div key={index} className="text-xs text-muted-foreground truncate">
                          {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                        </div>
                      ))}
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
              <h3 className="text-lg font-medium text-foreground mb-2">No Training Data</h3>
              <p className="text-muted-foreground">
                Start a training session to see real-time metrics and loss visualization.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
