import { LinearMemory } from "@niivue/niimath-js/src/linear-memory.js";

let linearMemory = new LinearMemory({ initial: 256, maximum: 2048 });
// export let wasmReady;

let niimathWasmPromise = await (async () => {
    let module 
    try {
        const wasmPath = new URL("./process-image.wasm", document.baseURI).href;

        const response = await fetch(wasmPath);
        module = await WebAssembly.instantiateStreaming(response, { env: linearMemory.env() });
    } catch (error) {
        console.error('Error loading or instantiating WebAssembly module:', error);
    }
    return module.instance.exports;

})();

export default niimathWasmPromise;
