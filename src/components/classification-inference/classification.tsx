"use client"

import { useState, useCallback } from "react"
import { Card } from "@/components/shadcn-ui/card"
import { Button } from "@/components/shadcn-ui/button"
import { Progress } from "@/components/shadcn-ui/progress"
import { Badge } from "@/components/shadcn-ui/badge"
import { Label } from "@/components/shadcn-ui/label"
import { Slider } from "@/components/shadcn-ui/slider"
import { Play, Square, Download, Tag, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface SegmentationResult {
  class: string
  confidence: number
  color: string
  visible: boolean
  region?: { x: number; y: number; width: number; height: number }
}

interface ClassificationResult {
  region: string
  classification: string
  confidence: number
  subclasses?: { name: string; probability: number }[]
}

interface ClassificationInferencePanelProps {
  segmentationResults: SegmentationResult[]
  currentImage: File | null
}

const classificationModels = [
  {
    id: "resnet50-pathology",
    name: "ResNet-50 Pathology",
    description: "Classify tissue types and pathological conditions",
    accuracy: 94.2,
    classes: ["Benign", "Malignant", "Normal"],
  },
  {
    id: "efficientnet-tumor",
    name: "EfficientNet Tumor Grade",
    description: "Grade tumor severity and type classification",
    accuracy: 92.8,
    classes: ["Grade I", "Grade II", "Grade III", "Grade IV"],
  },
  {
    id: "densenet-lesion",
    name: "DenseNet Lesion Type",
    description: "Classify lesion characteristics and severity",
    accuracy: 93.5,
    classes: ["Inflammatory", "Neoplastic", "Vascular", "Degenerative"],
  },
]

export function ClassificationInferencePanel({ segmentationResults, currentImage }: ClassificationInferencePanelProps) {
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7)
  const [classificationResults, setClassificationResults] = useState<ClassificationResult[]>([])

  const runClassification = useCallback(async () => {
    if (!selectedModel || segmentationResults.length === 0) return

    setIsProcessing(true)
    setProgress(0)
    setClassificationResults([])

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 15
      })
    }, 300)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    clearInterval(progressInterval)
    setProgress(100)

    // Generate mock classification results for each segmented region
    const mockResults: ClassificationResult[] = segmentationResults
      .filter((seg) => seg.visible && seg.class !== "Background")
      .map((seg) => {
        const model = classificationModels.find((m) => m.id === selectedModel)
        const randomClass = model?.classes[Math.floor(Math.random() * model.classes.length)] || "Unknown"
        const confidence = 0.75 + Math.random() * 0.2

        return {
          region: seg.class,
          classification: randomClass,
          confidence: confidence,
          subclasses: model?.classes.map((cls) => ({
            name: cls,
            probability: cls === randomClass ? confidence : Math.random() * (1 - confidence),
          })),
        }
      })

    setClassificationResults(mockResults.filter((r) => r.confidence >= confidenceThreshold))
    setIsProcessing(false)
  }, [selectedModel, segmentationResults, confidenceThreshold])

  const stopClassification = useCallback(() => {
    setIsProcessing(false)
    setProgress(0)
  }, [])

  const hasSegmentationResults = segmentationResults.length > 0
  const hasVisibleRegions = segmentationResults.some((r) => r.visible && r.class !== "Background")

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {!hasSegmentationResults && (
          <Card className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Segmentation Results</h3>
            <p className="text-muted-foreground">
              Please run segmentation inference first in the Segmentation tab to identify regions for classification.
            </p>
          </Card>
        )}

        {hasSegmentationResults && !hasVisibleRegions && (
          <Card className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Visible Regions</h3>
            <p className="text-muted-foreground">
              All segmented regions are hidden. Please make regions visible in the Segmentation tab.
            </p>
          </Card>
        )}

        {hasSegmentationResults && hasVisibleRegions && (
          <>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Segmented Regions for Classification</h3>
              <div className="space-y-3">
                {segmentationResults
                  .filter((result) => result.visible && result.class !== "Background")
                  .map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: result.color }} />
                        <div>
                          <p className="font-medium">{result.class}</p>
                          <p className="text-sm text-muted-foreground">
                            Segmentation Confidence: {(result.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-primary/20 text-primary">Ready for Classification</Badge>
                    </div>
                  ))}
              </div>
            </Card>

            {classificationResults.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Classification Results</h3>
                <div className="space-y-4">
                  {classificationResults.map((result, index) => (
                    <div key={index} className="p-4 bg-muted/50 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Region: {result.region}</p>
                          <p className="text-lg font-semibold text-foreground">{result.classification}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Confidence</p>
                          <p className="text-lg font-semibold text-primary">{(result.confidence * 100).toFixed(1)}%</p>
                        </div>
                      </div>

                      {result.subclasses && (
                        <div className="space-y-2 pt-2 border-t border-border">
                          <p className="text-xs font-medium text-muted-foreground">Class Probabilities:</p>
                          {result.subclasses
                            .sort((a, b) => b.probability - a.probability)
                            .map((subclass, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{subclass.name}</span>
                                <div className="flex items-center gap-2">
                                  <Progress value={subclass.probability * 100} className="w-24 h-2" />
                                  <span className="text-xs font-medium w-12 text-right">
                                    {(subclass.probability * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      <div className="space-y-6">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Classification Models</h3>
          <div className="space-y-3">
            {classificationModels.map((model) => (
              <div
                key={model.id}
                className={cn(
                  "p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm",
                  selectedModel === model.id && "ring-2 ring-primary bg-primary/5",
                  !hasVisibleRegions && "opacity-50 cursor-not-allowed",
                )}
                onClick={() => hasVisibleRegions && setSelectedModel(model.id)}
              >
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm">{model.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{model.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">Accuracy: {model.accuracy}%</span>
                      <Badge variant="outline" className="text-xs">
                        {model.classes.length} classes
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Classification Control</h3>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              {!selectedModel && <Badge variant="destructive">No Model</Badge>}
              {!hasVisibleRegions && <Badge variant="destructive">No Regions</Badge>}
              {selectedModel && hasVisibleRegions && <Badge className="bg-green-500/20 text-green-400">Ready</Badge>}
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Classifying...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <div>
              <Label className="text-sm font-medium">Confidence Threshold: {confidenceThreshold.toFixed(2)}</Label>
              <Slider
                value={[confidenceThreshold]}
                onValueChange={([value]) => setConfidenceThreshold(value)}
                max={1}
                min={0}
                step={0.05}
                className="mt-2"
              />
            </div>

            <div className="space-y-2">
              <Button
                onClick={runClassification}
                disabled={!selectedModel || !hasVisibleRegions || isProcessing}
                className="w-full flex items-center gap-2"
                size="lg"
              >
                <Play className="h-4 w-4" />
                {isProcessing ? "Classifying..." : "Run Classification"}
              </Button>

              {isProcessing && (
                <Button onClick={stopClassification} variant="destructive" className="w-full flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              )}

              {classificationResults.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2 bg-transparent"
                  onClick={() => {
                    const dataStr = JSON.stringify(classificationResults, null, 2)
                    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
                    const link = document.createElement("a")
                    link.setAttribute("href", dataUri)
                    link.setAttribute("download", `classification_results_${Date.now()}.json`)
                    link.click()
                  }}
                >
                  <Download className="h-4 w-4" />
                  Export Results
                </Button>
              )}
            </div>
          </div>
        </Card>

        {currentImage && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Current Image</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium truncate">{currentImage.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Regions:</span>
                <p className="font-medium">{segmentationResults.filter((r) => r.visible).length} visible</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
