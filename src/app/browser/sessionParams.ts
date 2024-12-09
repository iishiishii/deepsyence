export type Metadata = {
  id: string;
  memEstimateMB: number;
  title?: string;
  description?: string;
  sizeMB?: number;
  tags?: string[];
  referenceURL?: string;
};

export enum ModelType {
  Unknown = 1,
  Unet,
  SegmentAnything,
}

export type ImageMetadata = Metadata & {
  type?: ModelType;
  modelPaths: Map<string, string>;
  configPath?: string;
  preprocessorPath: string;
  examples?: string[];
};

export const ListImageModels = (
  tags?: string[],
  type?: ModelType[]
): ImageMetadata[] => {
  if (!tags && !type) {
    return models;
  }
  return models.filter((model) => {
    // console.log(".......... model ", model, type, model.type);
    let tagCheck = true;
    if (model.tags && tags && tags.length > 0) {
      tagCheck = tags.every((tag) => model.tags!.includes(tag));
    }
    let typeCheck = true;
    if (type && Array.isArray(type)) {
      typeCheck = type.includes(model.type as ModelType);
    }
    // console.log("tagCheck", tagCheck, "typeCheck", typeCheck);
    return tagCheck && typeCheck;
  });
};

export const models: ImageMetadata[] = [
  {
    id: "efficient-sam",
    title: "Efficient SAM quantized",
    description: "",
    memEstimateMB: 2600,
    type: ModelType.SegmentAnything,
    sizeMB: 45,
    configPath:
      "https://web-ai-models.org/image/feature-extraction/EfficientFormer/config.json",
    modelPaths: new Map<string, string>([
      [
        "encoder",
        "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/efficient_sam_vitt_encoder.onnx",
      ],
      [
        "decoder",
        "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/efficient_sam_vitt_decoder.onnx",
      ],
    ]),
    preprocessorPath:
      "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/efficient-sam-preprocess.json",
    tags: ["efficient-sam"],
    referenceURL: "https://github.com/yformer/EfficientSAM",
  },
  {
    id: "litemed-sam",
    title: "LiteMedSAM",
    description: "",
    memEstimateMB: 2600,
    type: ModelType.SegmentAnything,
    sizeMB: 45,
    configPath:
      "https://web-ai-models.org/image/feature-extraction/EfficientFormer/config.json",
    modelPaths: new Map<string, string>([
      [
        "encoder",
        "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/litemedsam_encoder.onnx",
      ],
      [
        "decoder",
        "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/litemedsam_decoder.onnx",
      ],
    ]),
    preprocessorPath:
      "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/lite-medsam-preprocess.json",
    tags: ["litemed-sam"],
    referenceURL: "https://github.com/bowang-lab/MedSAM/tree/LiteMedSAM",
  },
  {
    id: "sam-quantized",
    title: "SAM quantized",
    description: "",
    memEstimateMB: 2600,
    type: ModelType.SegmentAnything,
    sizeMB: 105,
    configPath:
      "https://web-ai-models.org/image/feature-extraction/EfficientFormer/config.json",
    modelPaths: new Map<string, string>([
      [
        "encoder",
        "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/sam_encoder_quant.onnx",
      ],
      [
        "decoder",
        "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/sam_decoder_quant.onnx",
      ],
    ]),
    preprocessorPath:
      "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/segmen-anything-preprocess.json",
    tags: ["sam-quantized"],
    referenceURL: "https://huggingface.co/visheratin/segment-anything-vit-b",
  },
  {
    id: "unet-gw-segmentation",
    title: "UNET GW segmentation",
    description: "",
    memEstimateMB: 2600,
    type: ModelType.Unet,
    sizeMB: 10,
    configPath:
      "https://web-ai-models.org/image/feature-extraction/EfficientFormer/config.json",
    modelPaths: new Map<string, string>([
      [
        "model",
        "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/unet_gw_segmentation.onnx",
      ],
    ]),
    preprocessorPath:
      "https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/unet-gw-preprocess.json",
    tags: ["unet-gw-segmentation"],
    referenceURL: "https://huggingface.co/visheratin/segment-anything-vit-b",
  },
];

export const SessionParams: SessionParameters = {
  numThreads: 0,
  executionProviders: ["wasm"],
  memoryLimitMB: 0,
  cacheSizeMB: 2500,
  wasmRoot: new URL("./js/", document.baseURI).href,
};

export interface SessionParameters {
  numThreads: number;
  executionProviders: string[];
  memoryLimitMB: number;
  cacheSizeMB: number;
  wasmRoot: string;
}
