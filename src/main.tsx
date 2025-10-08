import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  RouterProvider,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import "./index.css";
import MedicalImageProcessor from "@/components/image-processor.tsx";
import { Toaster } from "@/components/ui/sonner";

// Use runtime config if available, fallback to build-time env var
declare global {
  interface Window {
    ENV?: {
      VITE_API_URL?: string;
    };
  }
}

// OpenAPI.BASE = window.ENV?.VITE_API_URL || import.meta.env.VITE_API_URL || "";
// OpenAPI.TOKEN = async () => {
//   const token = localStorage.getItem("access_token") || "";
//   return token;
// };

// const handleApiError = (error: Error) => {
//   console.log("API error occurred:", error, "base URL:", OpenAPI.BASE);
//   if (error instanceof ApiError && [401, 403].includes(error.status)) {
//     localStorage.removeItem("access_token");
//     window.location.href = "/auth";
//   }
// };

// const queryClient = new QueryClient({
//   queryCache: new QueryCache({
//     onError: handleApiError,
//   }),
//   mutationCache: new MutationCache({
//     onError: handleApiError,
//   }),
// });

// const router = createRouter({
//   routeTree,
// });
// console.log("Router created with basepath:", router.basepath);

// declare module "@tanstack/react-router" {
//   interface Register {
//     router: typeof router;
//   }
// }

createRoot(document.getElementById("root")!).render(
  // disable strict mode for for better niivue development experience
  // <StrictMode>
  <div className="app-container">
    <div className="main-content">
      {/* <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} /> */}
      <MedicalImageProcessor />
      <Toaster position="top-center" richColors />
      {/* </QueryClientProvider> */}
    </div>
  </div>
  // </StrictMode>,
);
