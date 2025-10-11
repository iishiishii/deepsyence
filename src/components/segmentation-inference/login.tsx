"use client";

import { type SubmitHandler, useForm } from "react-hook-form";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "@/components/shadcn-ui/button";
import { Input } from "@/components/shadcn-ui/input";
import { Label } from "@/components/shadcn-ui/label";
import { CardContent, CardFooter } from "@/components/shadcn-ui/card";
import { TabsContent } from "@/components/shadcn-ui/tabs";
import { Checkbox } from "@/components/shadcn-ui/checkbox";
import type { Body_login_login_access_token as AccessToken } from "@/client";
import useAuth, { isLoggedIn } from "@/hooks/useAuth";
import { emailPattern, passwordRules } from "@/lib/auth-utils";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Login form hook
  const { loginMutation, error, resetError } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccessToken>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit: SubmitHandler<AccessToken> = async (data) => {
    console.log("Attempting login with data:", data);

    if (isSubmitting) return;

    resetError();

    try {
      await loginMutation.mutateAsync(data);
    } catch (error) {
      // error is handled by useAuth hook
      console.log("Login failed with error ", error);
    }
  };

  return (
    <TabsContent value="login">
      <form
        onSubmit={handleSubmit(onLoginSubmit, (errors) => {
          console.log("Validation errors", errors);
        })}
      >
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="username"
                className="pl-10"
                {...register("username", {
                  required: "Username is required",
                  pattern: emailPattern,
                })}
                placeholder="Email"
                type="email"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="pl-10 pr-10"
                {...register("password", passwordRules())}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          {/* <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={loginForm.rememberMe}
                onCheckedChange={(checked) =>
                  setLoginForm({
                    ...loginForm,
                    rememberMe: checked as boolean,
                  })
                }
              />
              <Label htmlFor="remember-me" className="text-sm">
                Remember me
              </Label>
            </div>
            <Button variant="link" className="px-0 text-sm">
              Forgot password?
            </Button>
          </div> */}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full mt-10"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </CardFooter>
      </form>
    </TabsContent>
  );
}
