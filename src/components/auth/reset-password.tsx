"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

export function ResetPassword() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  // Calculate validation message based on passwords
  const { message, isPasswordValid } = useMemo(() => {
    if (!password || !passwordConfirm) {
      return { message: "Passwords cannot be empty.", isPasswordValid: false };
    }

    return password === passwordConfirm
      ? { message: "Passwords match!", isPasswordValid: true }
      : { message: "Passwords do not match.", isPasswordValid: false };
  }, [password, passwordConfirm]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid || !token) return;

    try {
      setIsLoading(true);
      const result = await authClient.resetPassword({
        token,
        newPassword: password,
      });

      if (result?.error?.message) {
        throw new Error(result.error.message);
      }

      toast.success("Password reset successful");
      router.push("/sign-in");
    } catch (error) {
      handleError(
        error instanceof Error
          ? error
          : new Error("An unexpected error occurred"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Reset Password</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Invalid or missing reset token. Please request a new password reset
            link.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <Link href="/forgot-password">
            <Button variant="secondary" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Forgot Password
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md w-full">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Reset Password</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Create a new password for your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              required
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="passwordConfirm">Confirm New Password</Label>
            <Input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>

          <p
            className={`text-sm ${
              isPasswordValid ? "text-green-500" : "text-red-500"
            }`}
          >
            {message}
          </p>

          <Button
            type="submit"
            className="w-full relative"
            disabled={isLoading || !isPasswordValid}
          >
            {isLoading ? (
              <>
                <span className="opacity-0">Reset Password</span>
                <Loader2 className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-spin" />
              </>
            ) : (
              "Reset Password"
            )}
          </Button>

          <div className="text-center mt-2">
            <Link href="/sign-in" className="text-sm underline">
              Back to Sign In
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
