"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/shadcn-ui/card";
import { Brain, Zap, GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs";
import InferencePanel from "@/components/segmentation-inference/inference-panel";
import TrainingPanel from "@/components/classification-training/training-panel";
export type ImageFile = {
  id: string;
  name: string;
  file: File;
  selected: boolean;
};

type ProcessingTool = {
  id: string;
  name: string;
  description: string;
};

// export const nv = new Niivue({
//   dragAndDropEnabled: false,
//   textHeight: 0.02,
//   backColor: [0, 0, 0, 1],
//   crosshairColor: [244, 243, 238, 0.5],
//   multiplanarForceRender: false,
// });

export default function MedicalImageProcessor() {
  // const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("inference");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Brain className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  MedicalAI
                </h1>
                <p className="text-sm text-muted-foreground">
                  Medical Image Segmentation Platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-accent"></div>
              System Ready
            </div>
            {/* <Button variant="outline" size="sm" onClick={logout}>
              Sign Out
            </Button> */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 py-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-card">
            <TabsTrigger value="inference" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Inference
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Finetuning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inference" forceMount className={activeTab !== "inference" ? "hidden" : "space-y-6"}>
            <Card className="p-6">
              {/* <h2 className="text-lg font-semibold mb-4">
                Model Selection & Inference
              </h2> */}
              <InferencePanel />
            </Card>
          </TabsContent>
          
          <TabsContent value="training" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Model Training</h2>
              <TrainingPanel />
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
