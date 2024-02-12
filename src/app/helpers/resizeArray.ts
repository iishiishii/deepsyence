import Resize from "./resize";
import Resize2 from "./interpolation";
import * as nj from "numjs";
import { isNodePattern, throwError } from "./utils";
import { NdArray } from "numjs";
import { TypedArray } from "ndarray";

export interface NiiArray extends NdArray {
  constants,
  niiArray: nj.NdArray,

  /**
   * Resizes the image to a set width and height using a 2-pass bilinear algorithm
   * @param {number} w the width to resize the image to (or Jimp.AUTO)
   * @param {number} h the height to resize the image to (or Jimp.AUTO)
   * @param {string} mode (optional) a scaling method (e.g. Jimp.RESIZE_BEZIER)
   * @param {function(Error, nj.NdArray)} cb (optional) a callback for when complete
   * @returns {nj.NdArray} this for chaining of methods
   */
  resize(w: number, h: number, mode: string, cb?: (err: Error, data: nj.NdArray) => void): nj.NdArray;

}

export class NiiArrayHandler implements NiiArray{
      // constants;
      // niiArray: nj.NdArray | TypedArray;
      constructor(public niiArray: nj.NdArray) {
        this.constants = {
          RESIZE_NEAREST_NEIGHBOR: "nearestNeighbor",
          RESIZE_BILINEAR: "bilinearInterpolation",
          RESIZE_BICUBIC: "bicubicInterpolation",
          RESIZE_HERMITE: "hermiteInterpolation",
          RESIZE_BEZIER: "bezierInterpolation",
        };
        this.niiArray = niiArray;
      }
      
      resize(w, h, mode, cb) {
        if (typeof w !== "number" || typeof h !== "number") {
          return throwError.call(this, "w and h must be numbers", cb);
        }
  
        if (typeof mode === "function" && typeof cb === "undefined") {
          cb = mode;
          mode = null;
        }
  
        // if (w === this.constructor.AUTO && h === this.constructor.AUTO) {
        //   return throwError.call(this, "w and h cannot both be set to auto", cb);
        // }
  
        // if (w === this.constructor.AUTO) {
        //   w = this.shape[0] * (h / this.shape[1]);
        // }
  
        // if (h === this.constructor.AUTO) {
        //   h = this.shape[1] * (w / this.shape[0]);
        // }
  
        if (w < 0 || h < 0) {
          return throwError.call(this.niiArray, "w and h must be positive numbers", cb);
        }
  
        // round inputs
        w = Math.round(w) || 1;
        h = Math.round(h) || 1;
  
        if (typeof Resize2[mode] === "function") {
          // const dst = {
          //   data: Buffer.alloc(w * h * 4),
          //   width: w,
          //   height: h,
          // };
          const dst: nj.NdArray = nj.zeros(this.niiArray.shape);
          Resize2[mode](this.niiArray, dst);
          this.niiArray = dst;
        } else {
          let array = this.niiArray;
          const resize = new Resize(
            this.niiArray.shape[0],
            this.niiArray.shape[1],
            w,
            h,
            true,
            true,
            (buffer) => {
              array = buffer;
            }
          );
          resize.resize(this.niiArray.tolist());
        }
  
        if (isNodePattern(cb)) {
          cb.call(this, null, this);
        }
  
        return this;
    }
  }
