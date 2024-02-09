export function throwError(error: string | Error, cb: Function){
    if (typeof error === "string") {
      error = new Error(error);
    }
  
    if (typeof cb === "function") {
      return cb.call(this, error);
    }
  
    throw error;
  }

  export function isNodePattern(cb: Function | undefined) {
    if (typeof cb === "undefined") {
      return false;
    }
  
    if (typeof cb !== "function") {
      throw new TypeError("Callback must be a function");
    }
  
    return true;
  }