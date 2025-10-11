import { createFileRoute, redirect } from "@tanstack/react-router";
import { isLoggedIn } from "@/hooks/useAuth";
import { Card } from "@/components/shadcn-ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs";
import niivueIcon from "/assets/niivue-icon.png";
import Login from "@/components/segmentation-inference/login";
import Signup from "@/components/segmentation-inference/signup";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      });
    }
  },
});

function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black mb-4">
            {/* <Building2 className="w-8 h-8 text-white" /> */}
            <img src={niivueIcon} alt="Niivue" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Medical Image Processing
          </h1>
          <p className="text-gray-600 mt-2">
            Advanced medical imaging analysis platform
          </p>
        </div>

        <Card className="shadow-lg rounded-xs pt-0">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xs">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <Login />
            <Signup />
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
