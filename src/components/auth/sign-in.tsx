"use client";

import { ProviderName, providers } from "@/components/auth/social-providers";
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
import { authClient, checkPlugin } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import { cn } from "@/lib/utils";
import { Key, Loader2 } from "lucide-react";
import { SearchParams } from "next/dist/server/request/search-params";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { BetterFetchOption } from "@better-fetch/fetch";
import { CaptchaVerificationDialog } from "../captcha";
import { env } from "@/env";

type AuthOptions = {
  onSuccess: (context: {
    data: { twoFactorRedirect: boolean };
  }) => Promise<void>;
};

export function SignIn({
  enabledProviders = [],
  clientName,
  params,
}: {
  enabledProviders: Array<string>;
  clientName?: string | null;
  params?: SearchParams;
}) {
  const { data: session, isPending } = authClient.useSession();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<ProviderName | null>(
    null,
  );
  const hasProceededAfterCaptcha = useRef(false);

  const router = useRouter();
  const usernameEnabled = checkPlugin("username");
  const captchaEnabled = env.NEXT_PUBLIC_CAPTCHA_PROVIDER !== undefined;

  const paramsString = Object.entries(params || {})
    .map(([key, value], index) => `${index === 0 ? "?" : "&"}${key}=${value}`)
    .join("");

  useEffect(() => {
    if (session && !isPending) {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  // After captcha has been solved, proceed exactly once with the pending provider.
  useEffect(() => {
    if (
      captchaEnabled &&
      captchaToken &&
      pendingProvider &&
      !hasProceededAfterCaptcha.current
    ) {
      hasProceededAfterCaptcha.current = true;
      performSignIn(pendingProvider);
      setPendingProvider(null);
    }
  }, [captchaToken, pendingProvider, captchaEnabled]);

  useEffect(() => {
    if (captchaEnabled && captchaToken) {
      // Clear the captcha token after 2.5 minutes (150000 ms)
      const timer = setTimeout(() => {
        setCaptchaToken(null);
      }, 150000);
      return () => clearTimeout(timer);
    }
  }, [captchaToken, captchaEnabled]);

  if (session || isPending) {
    return <Loader2 className="h-8 w-8 animate-spin" />;
  }

  const isEmail = identifier.includes("@") || !usernameEnabled;

  // Wrapper that enforces captcha gating.
  function signIn(provider: ProviderName, callbackURL: string = "/dashboard") {
    // If captcha required and not yet solved, open dialog (only once).
    if (captchaEnabled && !captchaToken) {
      setPendingProvider(provider);
      // Prevent double-open in StrictMode / rapid double clicks.
      setCaptchaOpen(true);
      hasProceededAfterCaptcha.current = false;
      return;
    }
    performSignIn(provider, callbackURL);
  }

  // Actual sign-in logic (assumes captcha already satisfied or not required).
  async function performSignIn(
    provider: ProviderName,
    callbackURL: string = "/dashboard",
  ) {
    if (loading) return;

    const fetchOptions: BetterFetchOption | undefined = captchaEnabled
      ? {
          headers: {
            "x-captcha-response": captchaToken || "",
          },
        }
      : undefined;

    try {
      setLoading(true);

      const options: AuthOptions = {
        async onSuccess(context) {
          if (params?.prompt === "consent") {
            router.push("/oauth/consent" + paramsString);
          } else {
            router.push(
              context.data.twoFactorRedirect ? "/sign-in/2fa" : callbackURL,
            );
          }
        },
      };

      let result;
      switch (provider) {
        case "identifier": {
          if (isEmail) {
            result = await authClient.signIn.email(
              {
                email: identifier,
                password,
                rememberMe,
                fetchOptions,
              },
              options,
            );
          } else {
            result = await authClient.signIn.username(
              {
                username: identifier,
                password,
                rememberMe,
                fetchOptions,
              },
              options,
            );
          }
          break;
        }

        case "passkey":
          result = await authClient.signIn.passkey(
            { autoFill: false, fetchOptions },
            options,
          );
          break;

        default:
          result = await authClient.signIn.social(
            { provider, fetchOptions },
            options,
          );
          break;
      }

      if (result?.error?.message) {
        throw new Error(result.error.message);
      }
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    signIn("identifier");
  }

  return (
    <>
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">
            Sign {clientName ? `in to ${clientName}` : "In"}
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Enter your {usernameEnabled && !isEmail ? "username" : "email"}{" "}
            below to login to your account
            {clientName && (
              <span>
                {" "}
                and continue to the application <b>{clientName}</b>
              </span>
            )}
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="identifier">
                  {usernameEnabled && !isEmail ? "Username" : "Email"}
                </Label>
                <Input
                  id="identifier"
                  type={isEmail ? "email" : "text"}
                  placeholder={isEmail ? "m@example.com" : "username"}
                  required
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete={
                    isEmail ? "email webauthn" : "username webauthn"
                  }
                  value={identifier}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline"
                  >
                    Forgot your password?
                  </Link>
                </div>

                <Input
                  id="password"
                  type="password"
                  placeholder="password"
                  required
                  autoComplete="current-password webauthn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                />
                <Label htmlFor="remember" className="cursor-pointer">
                  Remember me
                </Label>
              </div>

              <div className="relative grid gap-2 mt-2">
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !identifier || !password}
                >
                  Login
                </Button>

                {checkPlugin("passkey") && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2"
                    onClick={() => signIn("passkey")}
                    disabled={loading}
                  >
                    <Key size={16} />
                    Sign in with Passkey
                  </Button>
                )}

                {enabledProviders.length > 0 && (
                  <div
                    className={cn(
                      "w-full gap-2 flex items-center pt-1 justify-center flex-wrap",
                    )}
                  >
                    {providers
                      .filter((provider) =>
                        enabledProviders.includes(provider.name),
                      )
                      .map((provider) => (
                        <Button
                          key={provider.name}
                          type="button"
                          variant="outline"
                          className={cn("flex-grow [&_svg]:size-5")}
                          onClick={() => signIn(provider.name)}
                          disabled={loading}
                        >
                          {provider.svg}
                        </Button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {captchaEnabled && (
        <CaptchaVerificationDialog
          open={captchaOpen}
          loading={loading}
          onOpenChange={(open) => !open && setCaptchaOpen(false)}
          onToken={(token) => {
            setCaptchaToken(token);
            setCaptchaOpen(false);
          }}
          onCancel={() => {
            setCaptchaOpen(false);
            setPendingProvider(null);
            hasProceededAfterCaptcha.current = false;
          }}
        />
      )}
    </>
  );
}
