import { ImageMetadata } from "./metadata";

export enum ModelType {
  Unknown = 1,
  Segmentation,
  SegmentAnything,
}

export const ListImageModels = (
  tags?: string[],
  type?: ModelType
): ImageMetadata[] => {
  if (!tags && !type) {
    return models;
  }
  return models.filter((model) => {
    let tagCheck = true;
    if (model.tags && tags && tags.length > 0) {
      tagCheck = tags.every((tag) => model.tags!.includes(tag));
    }
    let typeCheck = true;
    if (type) {
      typeCheck = model.type == type;
    }
    return tagCheck && typeCheck;
  });
};

export const models: ImageMetadata[] = [
  {
    id: "lite-medsam",
    title: "LiteMedSAM",
    description: "",
    memEstimateMB: 2600,
    type: ModelType.SegmentAnything,
    sizeMB: 377,
    configPath:
      "https://web-ai-models.org/image/feature-extraction/EfficientFormer/config.json",
    modelPaths: new Map<string, string>([
      [
        "encoder",
        "https://object-store.rc.nectar.org.au/v1/AUTH_dead991e1fa847e3afcca2d3a7041f5d/deepsyence/model/lite_medsam_encoder.onnx",
      ],
      [
        "decoder",
        "https://object-store.rc.nectar.org.au/v1/AUTH_dead991e1fa847e3afcca2d3a7041f5d/deepsyence/model/lite_medsam_decoder.onnx",
      ],
    ]),
    preprocessorPath:
      "https://object-store.rc.nectar.org.au/v1/AUTH_dead991e1fa847e3afcca2d3a7041f5d/deepsyence/model/lite-medsam-preprocess.json",
    tags: ["lite-medsam"],
    referenceURL: "https://huggingface.co/visheratin/segment-anything-vit-b",
  },
  {
    id: "efficient-sam",
    title: "Efficient SAM quantized",
    description: "",
    memEstimateMB: 2600,
    type: ModelType.SegmentAnything,
    sizeMB: 108,
    configPath:
      "https://web-ai-models.org/image/feature-extraction/EfficientFormer/config.json",
    modelPaths: new Map<string, string>([
      [
        "encoder",
        "https://object-store.rc.nectar.org.au/v1/AUTH_dead991e1fa847e3afcca2d3a7041f5d/deepsyence/model/efficient_sam_vitt_encoder.onnx",
      ],
      [
        "decoder",
        "https://object-store.rc.nectar.org.au/v1/AUTH_dead991e1fa847e3afcca2d3a7041f5d/deepsyence/model//efficient_sam_vitt_decoder.onnx",
      ],
    ]),
    preprocessorPath:
      "https://object-store.rc.nectar.org.au/v1/AUTH_dead991e1fa847e3afcca2d3a7041f5d/deepsyence/model/efficient-sam-preprocess.json",
    tags: ["efficient-sam"],
    referenceURL: "https://huggingface.co/visheratin/segment-anything-vit-b",
  },
];
