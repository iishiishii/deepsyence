import * as Comlink from "comlink";
import { Session } from "@/model/session";

if (typeof self !== "undefined") {
  Comlink.expose(Session);
}
