import * as Comlink from "comlink";
import { TrainSession } from "@/model/trainSession";

if (typeof self !== "undefined") {
  Comlink.expose(TrainSession);
}
