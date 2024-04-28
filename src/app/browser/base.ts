import { Session } from "./session";
import { ImageMetadata } from "./metadata";
import Preprocessor from "./preprocessor";
import { PreprocessorConfig } from "./preprocessorConfig";
// import Config from "./config";
import { createSession } from "./sessionController";
import { SessionParams } from "./sessionParams";

export class BaseImageModel {
  metadata: ImageMetadata;
  initialized: boolean;
  // config?: Config;
  preprocessor?: Preprocessor;
  sessions?: Map<string, Session>;

  constructor(metadata: ImageMetadata) {
    if (
      SessionParams.memoryLimitMB > 0 &&
      SessionParams.memoryLimitMB < metadata.memEstimateMB
    ) {
      throw new Error(
        `The model requires ${metadata.memEstimateMB} MB of memory, but the current memory limit is 
          ${SessionParams.memoryLimitMB} MB.`,
      );
    }
    this.metadata = metadata;
    this.initialized = false;
  }

  init = async (proxy = true): Promise<number> => {
    const start = new Date();
    for (const [name, path] of this.metadata.modelPaths) {
      console.log("init session", name, path);
      if (!this.sessions) {
        this.sessions = new Map<string, Session>();
      }
      console.log("create session", name, path);
      this.sessions.set(name, await createSession(path, proxy));
    }
    console.log("session", this.sessions);
    const preprocessorConfig = await PreprocessorConfig.fromFile(
      this.metadata.preprocessorPath,
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
