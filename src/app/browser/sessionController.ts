import * as ort from "onnxruntime-web";
import * as Comlink from "comlink";
import { Session } from "./session";
import { SessionParams } from "./sessionParams";

export const createSession = async (
  modelPath: string,
  proxy: boolean,
): Promise<Session> => {
  if (proxy && typeof document !== "undefined") {
    ort.env.wasm.proxy = true;
    console.log(
      "create session with proxy",
      new URL("./session.worker.js", import.meta.url),
    );
    const worker = new Worker(new URL("./session.worker.js", import.meta.url), {
      type: "module",
    });
    const Channel = Comlink.wrap<typeof Session>(worker);
    const session: Comlink.Remote<Session> = await new Channel(SessionParams);
    await session.init(modelPath);
    // @ts-ignore
    return session;
  } else {
    console.log("create session without proxy");
    ort.env.wasm.proxy = false;
    const session = new Session(SessionParams);
    await session.init(modelPath);
    return session;
  }
};
