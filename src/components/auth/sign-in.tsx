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
import { authClient, checkPlugin } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import { cn } from "@/lib/utils";
import { Key, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProviderName, providers } from "@/components/auth/social-providers";

type AuthOptions = {
  onSuccess: (context: {
    data: { twoFactorRedirect: boolean };
  }) => Promise<void>;
};

export function SignIn({
  enabledProviders = [],
}: {
  enabledProviders: Array<string>;
}) {
  const { data: session, isPending } = authClient.useSession();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const usernameEnabled = checkPlugin("username");

  useEffect(() => {
    if (session && !isPending) {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  if (session || isPending) {
    return <Loader2 className="h-8 w-8 animate-spin" />;
  }

  const isEmail = identifier.includes("@") || !usernameEnabled;

  /**
   * Handles the sign in process for various authentication providers
   * @param provider The authentication provider to use (email, passkey, or social provider)
   * @param callbackURL The URL to redirect to after successful authentication
   */
  async function signIn(
    provider: ProviderName,
    callbackURL: string = "/dashboard",
  ) {
    if (loading) return;

    try {
      setLoading(true);

      const options: AuthOptions = {
        async onSuccess(context) {
          router.push(
            context.data.twoFactorRedirect ? "/sign-in/2fa" : callbackURL,
          );
        },
      };

      // Handle different authentication methods
      let result;
      switch (provider) {
        case "identifier": {
          const authParams = {
            [isEmail ? "email" : "username"]: identifier,
            password,
            rememberMe,
          };

          result = await (isEmail
            ? authClient.signIn.email(authParams, options)
            : authClient.signIn.username(authParams, options));
          break;
        }

        case "passkey":
          result = await authClient.signIn.passkey(
            { autoFill: false },
            options,
          );
          break;

        default:
          result = await authClient.signIn.social({ provider }, options);
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

  return (
    <Card className="max-w-md w-full">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Enter your {usernameEnabled && !isEmail ? "username" : "email"} below
          to login to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            signIn("identifier");
          }}
        >
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
                autoComplete={isEmail ? "email webauthn" : "username webauthn"}
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

            <div className="relative grid gap-2">
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
  );
}
