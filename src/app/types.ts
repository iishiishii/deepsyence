import { Session } from "./browser/session";
export enum ViewType {
  AXIAL = "axial",
  CORONAL = "coronal",
  SAGITTAL = "sagittal",
  THREE_D = "3d",
  MULTI = "multi",
}

export enum JobType {
  LOAD_MODEL = "load model",
  LOAD_IMAGE = "load image", //wrong image format, or image too large
  RUN_MODEL = "run model",
}

export enum JobStatus {
  NOT_STARTED = "NotStarted",
  IN_PROGRESS = "InProgress",
  COMPLETE = "Complete",
  FAILED = "Failed",
}

export type Job = {
  // id: string;
  type: JobType;
  status: JobStatus;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  session: Session;
  error?: string;
};

export type JobNotification = {
  job: Job;
};

export enum ModelType {
  Unknown = 1,
  Unet,
  SegmentAnything,
}