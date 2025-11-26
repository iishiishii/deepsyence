import { Session } from "@/model/session";
import { ModelMetadata } from "@/components/segmentation-inference/model-selector";
import Preprocessor from "@/model/preprocessor";
import { PreprocessorConfig } from "@/model/preprocessorConfig";
import { createSession, SessionWrapper } from "@/model/sessionController";
import {
  createTrainSession,
  TrainSessionWrapper,
} from "@/model/trainSessionController";
import { SessionParams } from "@/model/sessionParams";
import { TrainSession } from "@/model/trainSession";
export class BaseImageModel {
  metadata: ModelMetadata;
  initialized: boolean;
  // config?: Config;
  preprocessor?: Preprocessor;
  sessions?: Map<string, Session | SessionWrapper>;
  trainSession?: Map<string, TrainSession | TrainSessionWrapper>;

  constructor(metadata: ModelMetadata) {
    if (
      SessionParams.memoryLimitMB > 0 &&
      SessionParams.memoryLimitMB < metadata.memEstimateMB
    ) {
      throw new Error(
        `The model requires ${metadata.memEstimateMB} MB of memory, but the current memory limit is 
          ${SessionParams.memoryLimitMB} MB.`
      );
    }
    this.metadata = metadata;
    this.initialized = false;
  }

  init = async (proxy = true, sessionType = "inference"): Promise<number> => {
    const start = new Date();

    if (sessionType === "training") {
      if (!this.trainSession) {
        console.log("init train session");
        this.trainSession = new Map<string, TrainSession>();
      }
      console.log("create training session");
      this.trainSession.set("training", await createTrainSession(proxy));
    } else {
      for (const [name, path] of this.metadata.modelPaths) {
        console.log("init session", name, path);
        if (!this.sessions) {
          this.sessions = new Map<string, Session>();
        }
        console.log("create session", name, path);

        this.sessions.set(name, await createSession(path, proxy));
      }
    }

    console.log("session", this.sessions);
    const preprocessorConfig = await PreprocessorConfig.fromFile(
      this.metadata.preprocessorPath
    );

    this.preprocessor = new Preprocessor(preprocessorConfig);
    // if (this.metadata.configPath) {
    //   this.config = await Config.fromFile(this.metadata.configPath);
    // }
    this.initialized = true;
    const end = new Date();
    const elapsed = (end.getTime() - start.getTime()) / 1000;
    return elapsed;
  };
}
