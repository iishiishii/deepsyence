import { models } from "./sessionParams";
import { SegmentAnythingModel } from "./samModel";
import { UnetModel } from "./unetModel";
import { ModelType } from "../types";

export interface InitImageModelResult {
  model: ImageModel;
  elapsed: number;
}

export class ImageModel {
  static create = async (
    id: string,
    proxy = true
  ): Promise<InitImageModelResult> => {
    for (const modelMetadata of models) {
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
    throw Error("there is no image model with specified id");
  };
}
