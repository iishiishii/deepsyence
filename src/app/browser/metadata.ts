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
  Segmentation,
  SegmentAnything,
}

export type ImageMetadata = Metadata & {
  type?: ModelType;
  modelPaths: Map<string, string>;
  configPath?: string;
  preprocessorPath: string;
  examples?: string[];
};
