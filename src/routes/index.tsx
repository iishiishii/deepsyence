import {
  Link as RouterLink,
  createFileRoute,
  redirect,
} from "@tanstack/react-router";
import MedicalImageProcessor from "@/components/image-processor.tsx";
import { isLoggedIn } from "@/hooks/useAuth";

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
