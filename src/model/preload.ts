export async function loadOpenCVWasm() {
  // Set global config before OpenCV loads
  if (typeof window !== "undefined") {
    (window as any).Module = {
      locateFile: (path: string) => {
        if (path.endsWith(".wasm")) {
          return `https://object-store.rc.nectar.org.au/v1/AUTH_bdf528c1856c401b9a6fcfc700260330/deepsyence/${path}`;
        }
        return path;
      },
      onRuntimeInitialized: () => {
        console.log("OpenCV ready via global config");
      },
    };
  }

  // Import OpenCV after setting config
  const { cv } = await import("opencv-web");

  // Wait for initialization if needed
  return new Promise((resolve, reject) => {
    const checkReady = () => {
      if (cv && cv.Mat) {
        resolve(cv);
      } else {
        setTimeout(checkReady, 100);
      }
    };
    checkReady();

    // Timeout after 30 seconds
    setTimeout(() => reject(new Error("OpenCV loading timeout")), 300);
  });
}
