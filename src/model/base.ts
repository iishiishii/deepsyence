import { Session } from "@/model/session";
import { ModelMetadata } from "@/components/segmentation-inference/model-selector";
import Preprocessor from "@/model/preprocessor";
import { PreprocessorConfig } from "@/model/preprocessorConfig";
import { createSession, SessionWrapper } from "@/model/sessionController";
import { SessionParams } from "@/model/sessionParams";
import MemoryPool from "@/helpers/utils/memoryPool";
export class BaseImageModel {
  metadata: ModelMetadata;
  initialized: boolean;
  // config?: Config;
  preprocessor?: Preprocessor;
  sessions?: Map<string, Session | SessionWrapper>;
  memoryPool: MemoryPool = new MemoryPool();

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
      this.metadata.preprocessorPath
    );

    this.preprocessor = new Preprocessor(preprocessorConfig, this.memoryPool);
    // if (this.metadata.configPath) {
    //   this.config = await Config.fromFile(this.metadata.configPath);
    // }
    this.initialized = true;
    const end = new Date();
    const elapsed = (end.getTime() - start.getTime()) / 1000;
    return elapsed;
  };
}
