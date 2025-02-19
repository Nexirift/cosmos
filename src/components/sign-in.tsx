"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Key, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignIn() {
  const { data: session } = authClient.useSession();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  console.log(session);

  const isEmail = identifier.includes("@");

  /**
   * Displays an error toast notification to the user
   * @param error The error object containing the message to display
   */
  function handleError(error: Error) {
    toast({
      description: error.message || "An error occurred during sign in",
      variant: "destructive",
      duration: 3000,
    });
  }

  /**
   * Handles the sign in process for various authentication providers
   * @param provider The authentication provider to use (email, passkey, or social provider)
   * @param callbackURL The URL to redirect to after successful authentication
   */
  async function signIn(
    provider:
      | "identifier"
      | "passkey"
      | "github"
      | "apple"
      | "discord"
      | "facebook"
      | "microsoft"
      | "google"
      | "spotify"
      | "twitch"
      | "twitter"
      | "dropbox"
      | "linkedin"
      | "gitlab"
      | "reddit",
    callbackURL: string = "/",
  ) {
    try {
      setLoading(true);

      let result;

      // Handle different authentication methods
      switch (provider) {
        case "identifier":
          if (isEmail) {
            result = await authClient.signIn.email({
              email: identifier,
              password,
              callbackURL,
              rememberMe,
            });
          } else {
            result = await authClient.signIn.username({
              username: identifier,
              password,
              rememberMe,
              fetchOptions: {
                onSuccess: () => {
                  router.push("/");
                },
              },
            });
          }
          break;

        case "passkey":
          result = await authClient.signIn.passkey();
          break;

        default:
          result = await authClient.signIn.social({
            provider,
            callbackURL,
          });
          break;
      }

      // Check for and handle any errors from the authentication attempt
      if (result?.error?.message) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        handleError(error);
      } else {
        handleError(new Error("An unexpected error occurred"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Enter your username or email below to login to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="identifier">
                {isEmail ? "Email" : "Username"}
              </Label>
              <Input
                id="identifier"
                type={isEmail ? "email" : "text"}
                placeholder={isEmail ? "m@example.com" : "username"}
                required
                onChange={(e) => {
                  setIdentifier(e.target.value);
                }}
                value={identifier}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
              </div>

              <Input
                id="password"
                type="password"
                placeholder="password"
                autoComplete="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                onClick={() => {
                  setRememberMe(!rememberMe);
                }}
              />
              <Label htmlFor="remember">Remember me</Label>
            </div>

            <div className="relative grid gap-2">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                onClick={async () => signIn("identifier")}
              >
                Login
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={async () => signIn("passkey")}
              >
                <Key size={16} />
                Sign in with Passkey
              </Button>

              <div
                className={cn(
                  "w-full gap-2 flex items-center pt-1",
                  "justify-center flex-wrap",
                )}
              >
                <Button
                  type="button"
                  variant="outline"
                  className={cn("flex-grow [&_svg]:size-5")}
                  onClick={async () => signIn("google")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20cm"
                    height="20cm"
                    viewBox="0 0 256 262"
                  >
                    <path
                      fill="#4285F4"
                      d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                    ></path>
                    <path
                      fill="#EB4335"
                      d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                    ></path>
                  </svg>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn("flex-grow [&_svg]:size-5")}
                  onClick={async () => signIn("github")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20cm"
                    height="20cm"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
                    ></path>
                  </svg>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn("flex-grow [&_svg]:size-5")}
                  onClick={async () => signIn("twitter")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20cm"
                    height="20cm"
                    viewBox="0 0 640 640"
                  >
                    <path
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      d="M640.012 121.513c-23.528 10.524-48.875 17.516-75.343 20.634 27.118-16.24 47.858-41.977 57.756-72.615-25.347 14.988-53.516 25.985-83.363 31.866-24-25.5-58.087-41.35-95.848-41.35-72.508 0-131.21 58.736-131.21 131.198 0 10.228 1.134 20.232 3.355 29.882-109.1-5.528-205.821-57.757-270.57-137.222a131.423 131.423 0 0 0-17.764 66c0 45.497 23.102 85.738 58.347 109.207-21.508-.638-41.74-6.638-59.505-16.359v1.642c0 63.627 45.225 116.718 105.32 128.718-11.008 2.988-22.63 4.642-34.606 4.642-8.48 0-16.654-.874-24.78-2.35 16.783 52.11 65.233 90.095 122.612 91.205-44.989 35.245-101.493 56.233-163.09 56.233-10.63 0-20.988-.65-31.334-1.89 58.229 37.359 127.206 58.997 201.31 58.997 241.42 0 373.552-200.069 373.552-373.54 0-5.764-.13-11.35-.366-16.996 25.642-18.343 47.87-41.493 65.469-67.844l.059-.059z"
                    />
                  </svg>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn("flex-grow [&_svg]:size-5")}
                  onClick={async () => signIn("twitch")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20cm"
                    height="20cm"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M11.64 5.93h1.43v4.28h-1.43m3.93-4.28H17v4.28h-1.43M7 2L3.43 5.57v12.86h4.28V22l3.58-3.57h2.85L20.57 12V2m-1.43 9.29l-2.85 2.85h-2.86l-2.5 2.5v-2.5H7.71V3.43h11.43Z"
                    ></path>
                  </svg>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn("flex-grow [&_svg]:size-5")}
                  onClick={async () => signIn("gitlab")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20cm"
                    height="20cm"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="m22.749 9.769l-.031-.08l-3.027-7.9a.79.79 0 0 0-.782-.495a.8.8 0 0 0-.456.17a.8.8 0 0 0-.268.408L16.14 8.125H7.865L5.822 1.872a.8.8 0 0 0-.269-.409a.81.81 0 0 0-.926-.05c-.14.09-.25.22-.312.376L1.283 9.684l-.03.08a5.62 5.62 0 0 0 1.864 6.496l.01.008l.028.02l4.61 3.453l2.282 1.726l1.39 1.049a.935.935 0 0 0 1.13 0l1.389-1.05l2.281-1.726l4.639-3.473l.011-.01A5.62 5.62 0 0 0 22.75 9.77"
                    ></path>
                  </svg>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn("flex-grow [&_svg]:size-5")}
                  onClick={async () => signIn("discord")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20cm"
                    height="20cm"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.1.1 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.1 16.1 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02M8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12m6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12"
                    ></path>
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
