import { Session } from "./session";
import { models, ModelType } from "./modelConfig";
import { SegmentAnythingModel } from "./samModel";

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
        }
      }
    }
    throw Error("there is no image model with specified id");
  };
}
