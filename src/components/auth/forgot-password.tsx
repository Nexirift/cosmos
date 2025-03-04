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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authClient } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState, FormEvent, useCallback } from "react";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  /**
   * Handles the password reset request
   */
  const requestPasswordReset = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (loading || !email.trim()) return;

      try {
        setLoading(true);
        const result = await authClient.forgetPassword({
          email: email.trim(),
          redirectTo: "/reset-password",
        });

        if (result?.error) {
          throw new Error(result.error.message);
        }

        setEmailSent(true);
      } catch (error) {
        handleError(
          error instanceof Error
            ? error
            : new Error("An unexpected error occurred"),
        );
      } finally {
        setLoading(false);
      }
    },
    [email, loading],
  );

  const resetForm = useCallback(() => setEmailSent(false), []);

  return (
    <Card className="max-w-md w-full">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Forgot Password</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          {emailSent
            ? "Check your inbox for the reset password link."
            : "Enter your email address and we'll send you a link to reset your password."}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        {emailSent ? (
          <div className="grid gap-4">
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <Mail className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                If an account exists with {email}, you will receive a password
                reset email shortly.
              </AlertDescription>
            </Alert>

            <Button variant="outline" className="w-full" onClick={resetForm}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to reset form
            </Button>
          </div>
        ) : (
          <form onSubmit={requestPasswordReset} noValidate>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="relative grid gap-2">
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !email.trim()}
                >
                  Send Reset Link
                </Button>

                <div className="text-center">
                  <Link
                    href="/sign-in"
                    className="text-sm underline hover:text-primary"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
