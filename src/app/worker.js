import { LinearMemory } from "@niivue/niimath-js/src/linear-memory.js";

let linearMemory = new LinearMemory({ initial: 256, maximum: 2048 });
// export let wasmReady;

let niimathWasmPromise = await (async () => {
  let module;
  try {
    const wasmPath = new URL("./process-image.wasm", document.baseURI).href;

    const response = await fetch(wasmPath);
    module = await WebAssembly.instantiateStreaming(response, {
      env: linearMemory.env(),
    });
  } catch (error) {
    console.error("Error loading or instantiating WebAssembly module:", error);
  }
  return module.instance.exports;
})();

export default () => {
  // eslint-disable-next-line no-restricted-globals
  self.onmessage = async (e) => {
    await niimathWasmPromise.then((niimathWasm) => {
      // const niimathWasm = niimathWasmPromise;
      console.log("message", e);
      const imageMetadata = e.data[0];
      const imageBytes = e.data[1];
      const cmd = e.data[2];
      const isNewLayer = e.data[3];

      let cptr = niimathWasm.walloc(cmd.length + 1);
      linearMemory.record_malloc(cptr, cmd.length + 1);
      let cmdstr = new Uint8Array(cmd.length + 1);
      for (let i = 0; i < cmd.length; i++) cmdstr[i] = cmd.charCodeAt(i);
      let cstr = new Uint8Array(
        niimathWasm.memory.buffer,
        cptr,
        cmd.length + 1,
      );
      cstr.set(cmdstr);
      //allocate WASM image data
      let nvox =
        imageMetadata.nx *
        imageMetadata.ny *
        imageMetadata.nz *
        imageMetadata.nt;
      let ptr = niimathWasm.walloc(nvox * imageMetadata.bpv);
      linearMemory.record_malloc(ptr, nvox * imageMetadata.bpv);
      let cimg = new Uint8Array(
        niimathWasm.memory.buffer,
        ptr,
        nvox * imageMetadata.bpv,
      );
      cimg.set(new Uint8Array(imageBytes));
      // console.log(niimathWasm);
      let ok = niimathWasm.niimath(
        ptr,
        imageMetadata.datatypeCode,
        imageMetadata.nx,
        imageMetadata.ny,
        imageMetadata.nz,
        imageMetadata.nt,
        imageMetadata.dx,
        imageMetadata.dy,
        imageMetadata.dz,
        imageMetadata.dt,
        cptr,
      );

      if (ok != 0) {
        console.error(" -> '", cmd, " generated a fatal error: ", ok);
        return;
      }
      cimg = new Uint8Array(
        niimathWasm.memory.buffer,
        ptr,
        nvox * imageMetadata.bpv,
      );
      // https://stackoverflow.com/questions/59705741/why-memory-could-not-be-cloned
      let clone = new Uint8Array(cimg, 0, nvox * imageMetadata.bpv);

      // post modified bytes and id of
      postMessage({
        id: imageMetadata.id,
        imageBytes: clone,
        cmd,
        isNewLayer,
      });

      //free WASM memory
      linearMemory.record_free(cptr);
      niimathWasm.wfree(cptr);
      linearMemory.record_free(ptr);
      niimathWasm.wfree(ptr);
    });
  };
};
// export default onmessage();
