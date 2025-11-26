import * as ort from "onnxruntime-web/training";
import * as Comlink from "comlink";
import { TrainSession } from "@/model/trainSession";
import { SessionParams, TrainSessionParams } from "@/model/sessionParams";

// Wrapper class to handle tensor serialization for Comlink
export class TrainSessionWrapper {
  private session: Comlink.Remote<TrainSession>;

  constructor(session: Comlink.Remote<TrainSession>) {
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

  async runEvalStep(
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
    return await this.session.runEvalStep(
      Comlink.transfer(serializedInput, [
        ...Object.values(serializedInput)
          .filter((v: any) => v._isTensor)
          .map((v: any) => v.data.buffer),
      ])
    );
  }

  async init(): Promise<void> {
    return await this.session.init();
  }

  async inputNames(): Promise<readonly string[]> {
    return await this.session.trainInputNames();
  }

  async outputNames(): Promise<readonly string[]> {
    return await this.session.trainOutputNames();
  }

  async release(): Promise<void> {
    return await this.session.release();
  }
}

export const createTrainSession = async (
  proxy: boolean
): Promise<TrainSession | TrainSessionWrapper> => {
  if (proxy && typeof document !== "undefined") {
    console.log("create training session with proxy");
    ort.env.wasm.proxy = true;
    const worker = new Worker(
      new URL("./trainSession.worker.js", import.meta.url),
      {
        type: "module",
      }
    );
    const Channel = Comlink.wrap<typeof TrainSession>(worker);
    console.log("worker created for training session", worker);

    try {
      const session: Comlink.Remote<TrainSession> = await new Channel(
        "training",
        TrainSessionParams
      );
      console.log("initializing training session in worker");
      await session.init();
      return new TrainSessionWrapper(session);
    } catch (e) {
      console.error("Error creating remote training session:", e);
      throw e;
    }
  } else {
    console.log("create session without proxy");
    ort.env.wasm.proxy = false;
    const session = new TrainSession("training", TrainSessionParams);
    await session.init();
    return session;
  }
};
