import {
  Link as RouterLink,
  createFileRoute,
  redirect,
} from "@tanstack/react-router";
import MedicalImageProcessor from "@/image-processor";

export const Route = createFileRoute("/")({
  component: MedicalImageProcessor,
  // beforeLoad: async () => {
  //   if (!isLoggedIn()) {
  //     throw redirect({
  //       to: "/auth",
  //     });
  //   }
  // },
});
