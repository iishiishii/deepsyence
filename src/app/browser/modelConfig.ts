import { ImageMetadata } from "./metadata";

export enum ModelType {
  Unknown = 1,
  Classification,
  Segmentation,
  ObjectDetection,
  Img2Img,
  FeatureExtraction,
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

const classificationExamples: string[] = [
  "https://web-ai-models.org/images/classification/image-1.jpg",
  "https://web-ai-models.org/images/classification/image-2.jpg",
  "https://web-ai-models.org/images/classification/image-3.jpg",
  "https://web-ai-models.org/images/classification/image-4.jpg",
  "https://web-ai-models.org/images/classification/image-5.jpg",
  "https://web-ai-models.org/images/classification/image-6.jpg",
];

const segmentationExamples: string[] = [
  "https://web-ai-models.org/images/segmentation/image-1.jpg",
  "https://web-ai-models.org/images/segmentation/image-2.jpg",
  "https://web-ai-models.org/images/segmentation/image-3.jpg",
  "https://web-ai-models.org/images/segmentation/image-4.jpg",
  "https://web-ai-models.org/images/segmentation/image-5.jpg",
  "https://web-ai-models.org/images/segmentation/image-6.jpg",
];

const superresExamples: string[] = [
  "https://web-ai-models.org/images/superres/butterfly.png",
  "https://web-ai-models.org/images/superres/shanghai.jpg",
  "https://web-ai-models.org/images/superres/tree.jpg",
];

export const models: ImageMetadata[] = [
  {
    id: "segment-anything-quant",
    title: "Segment Anything quantized",
    description: "",
    memEstimateMB: 2600,
    type: ModelType.SegmentAnything,
    sizeMB: 108,
    configPath:
      "https://web-ai-models.org/image/feature-extraction/EfficientFormer/config.json",
    modelPaths: new Map<string, string>([
      [
        "encoder",
        new URL("./model/efficient_sam_vitt_encoder.onnx", document.baseURI)
          .href,
      ],
      [
        "decoder",
        new URL("./model/efficient_sam_vitt_decoder.onnx", document.baseURI)
          .href,
      ],
    ]),
    preprocessorPath: new URL(
      "./model/efficient-sam-preprocess.json",
      document.baseURI
    ).href,
    tags: ["segment-anything"],
    referenceURL: "https://huggingface.co/visheratin/segment-anything-vit-b",
  },
  {
    id: "segment-anything",
    title: "Segment Anything",
    description: "",
    memEstimateMB: 2600,
    type: ModelType.SegmentAnything,
    sizeMB: 377,
    configPath:
      "https://web-ai-models.org/image/feature-extraction/EfficientFormer/config.json",
    modelPaths: new Map<string, string>([
      [
        "encoder",
        "https://huggingface.co/visheratin/segment-anything-vit-b/resolve/main/encoder.onnx",
      ],
      [
        "decoder",
        "https://huggingface.co/visheratin/segment-anything-vit-b/resolve/main/decoder.onnx",
      ],
    ]),
    preprocessorPath:
      "https://huggingface.co/visheratin/segment-anything-vit-b/resolve/main/preprocessor_config.json",
    tags: ["segment-anything"],
    referenceURL: "https://huggingface.co/visheratin/segment-anything-vit-b",
  },
];
