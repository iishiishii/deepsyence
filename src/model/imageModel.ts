import { segmentationModels, ModelType } from "@/components/model-selector";
import { SegmentAnythingModel } from "@/model/samModel";
import { UnetModel } from "@/model/unetModel";
import { toast } from "sonner";

export interface InitImageModelResult {
  model: UnetModel | SegmentAnythingModel | null;
  elapsed: number;
}

export class ImageModel {
  static create = async (
    id: string,
    proxy = true
  ): Promise<InitImageModelResult> => {
    try {
      for (const modelMetadata of segmentationModels) {
        console.log("modelMetadata", modelMetadata);

        if (modelMetadata.id === id) {
          switch (modelMetadata.type) {
            case ModelType.SegmentAnything: {
              const model = new SegmentAnythingModel(modelMetadata);
              const elapsed = await model.init(proxy);
              return {
                model: model,
                elapsed: elapsed,
              };
            }
            case ModelType.Unet: {
              const model = new UnetModel(modelMetadata);
              const elapsed = await model.init(proxy);
              return {
                model: model,
                elapsed: elapsed,
              };
            }
          }
        }
      }
      return {
        model: null,
        elapsed: 0,
      };
    } catch (error) {
      console.error("Error initializing model:", error);
      toast("Error initializing model:" + error);
      return {
        model: null,
        elapsed: 0,
      };
    }
  };
}
