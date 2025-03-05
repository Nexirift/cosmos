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
import { authClient, checkPlugin } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DatePicker } from "../date-picker";
import { toast } from "sonner";

interface SignUpProps {
  invite?: string;
}

export function SignUp({ invite }: SignUpProps) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthday: undefined as Date | undefined,
  });
  const [loading, setLoading] = useState(false);

  const { username, email, password, confirmPassword, birthday } = formData;

  useEffect(() => {
    if (session && !isPending) {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  if (session || isPending) {
    return <Loader2 className="h-8 w-8 animate-spin" />;
  }

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const setBirthday = (date: Date | undefined) => {
    setFormData((prev) => ({
      ...prev,
      birthday: date,
    }));
  };

  async function signUp() {
    if (loading) return;
    if (password !== confirmPassword) {
      handleError(new Error("Passwords do not match"));
      return;
    }

    try {
      setLoading(true);
      const result = await authClient.signUp.email({
        name: username,
        username,
        email,
        password,
        birthday:
          checkPlugin("birthday") && birthday
            ? format(birthday, "yyyy-MM-dd")
            : undefined,
        invitation: invite,
      });

      if (result?.error?.message) {
        throw new Error(result.error.message);
      }

      toast.success("Please check your email to finish registration.");
    } catch (error) {
      handleError(
        error instanceof Error
          ? error
          : new Error("An unexpected error occurred"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-md w-full">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Sign Up</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Create a new account by filling out the form below.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            signUp();
          }}
        >
          <div className="grid gap-4">
            {checkPlugin("username") && (
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="username"
                  required
                  onChange={handleInputChange("username")}
                  autoComplete="username"
                  value={username}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                onChange={handleInputChange("email")}
                autoComplete="email"
                value={email}
              />
            </div>

            {checkPlugin("birthday") && (
              <div className="grid gap-2">
                <Label htmlFor="birthday">Birthday</Label>
                <DatePicker setDate={setBirthday} date={birthday} />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={handleInputChange("password")}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="confirm password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={handleInputChange("confirmPassword")}
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
                disabled={
                  loading ||
                  !username ||
                  !email ||
                  !password ||
                  !confirmPassword ||
                  !birthday
                }
              >
                Sign Up
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
