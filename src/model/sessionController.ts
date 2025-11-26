import * as ort from "onnxruntime-web";
import * as Comlink from "comlink";
import { Session } from "@/model/session";
import { SessionParams } from "@/model/sessionParams";

// Wrapper class to handle tensor serialization for Comlink
export class SessionWrapper {
  private session: Comlink.Remote<Session>;

  constructor(session: Comlink.Remote<Session>) {
    this.session = session;
  }

  async run(
    input: ort.InferenceSession.OnnxValueMapType
  ): Promise<ort.InferenceSession.OnnxValueMapType> {
    // Serialize tensors to plain objects for Comlink transfer
    const serializedInput: any = {};
    for (const [key, value] of Object.entries(input)) {
      if (value instanceof ort.Tensor) {
        serializedInput[key] = {
          data: value.data,
          dims: value.dims,
          type: value.type,
          _isTensor: true,
        };
      } else {
        serializedInput[key] = value;
      }
    }

    // Transfer with explicit transferable objects
    return await this.session.run(
      Comlink.transfer(serializedInput, [
        ...Object.values(serializedInput)
          .filter((v: any) => v._isTensor)
          .map((v: any) => v.data.buffer),
      ])
    );
  }

  async init(modelPath: string): Promise<void> {
    return await this.session.init(modelPath);
  }

  async inputNames(): Promise<readonly string[]> {
    return await this.session.inputNames();
  }

  async outputNames(): Promise<readonly string[]> {
    return await this.session.outputNames();
  }

  async release(): Promise<void> {
    return await this.session.release();
  }
}

export const createSession = async (
  modelPath: string,
  proxy: boolean
): Promise<Session | SessionWrapper> => {
  if (proxy && typeof document !== "undefined") {
    ort.env.wasm.proxy = true;
    console.log(
      "create session with proxy",
      new URL("./session.worker.js", import.meta.url)
    );
    const worker = new Worker(new URL("./session.worker.js", import.meta.url), {
      type: "module",
    });
    const Channel = Comlink.wrap<typeof Session>(worker);
    const session: Comlink.Remote<Session> = await new Channel(
      "inference",
      SessionParams
    );
    await session.init(modelPath);
    return new SessionWrapper(session);
  } else {
    console.log("create session without proxy");
    ort.env.wasm.proxy = false;
    const session = new Session("inference", SessionParams);
    await session.init(modelPath);
    return session;
  }
};
