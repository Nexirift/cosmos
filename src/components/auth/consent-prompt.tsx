"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ConsentPrompt({
  name,
  icon,
  scopes,
}: {
  name: string;
  icon: string;
  scopes: string[];
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const scopeMap = {
    openid: {
      friendlyName: "OpenID Connect",
      description: "Allows the application to authenticate your account.",
    },
    profile: {
      friendlyName: "Profile",
      description:
        "Allows the application to retrieve your name and profile picture.",
    },
    email: {
      friendlyName: "Email",
      description: "Allows the application to retrieve your email address.",
    },
  };

  const handleAction = async (accept: boolean) => {
    try {
      setLoading(true);

      const result = await authClient.oauth2.consent({
        accept,
      });

      const error = result?.error as unknown as { error_description?: string };

      if (error?.error_description) {
        throw new Error(error.error_description);
      }

      if (result?.data?.redirectURI) {
        return router.push(result.data.redirectURI);
      }

      throw new Error("An unexpected error occurred");
    } catch (error) {
      if (error instanceof Error) {
        handleError(error);
      } else {
        handleError(new Error("An unexpected error occurred"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return <Loader2 className="h-8 w-8 animate-spin" />;
  }

  return (
    <Card className="w-full max-w-md shadow-lg gap-4 hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="space-y-2">
        <CardTitle className="flex flex-col items-center text-center text-lg font-bold md:text-xl">
          {icon && (
            <Image
              src={icon}
              alt={`${name} icon`}
              width={64}
              height={64}
              className="mb-2 rounded-lg border bg-secondary/30 shadow-sm hover:scale-105 transition-transform duration-200"
              priority
            />
          )}
          <h3 className="text-xl font-bold">{name}</h3>
        </CardTitle>
        <CardDescription className="flex flex-col items-center text-center mt-2 mb-2">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-4">
              This application is requesting to access the following scopes:
            </p>
            <ul className="list-inside list-disc gap-2 flex flex-col">
              {scopes.map((scope) => {
                const mapped = scopeMap[scope as keyof typeof scopeMap] ?? {
                  friendlyName: scope.charAt(0).toUpperCase() + scope.slice(1),
                  description:
                    "We do not have any information about this scope.",
                };
                return (
                  <li
                    key={scope}
                    className="transition-colors duration-200 hover:text-primary"
                  >
                    <b>{mapped.friendlyName}:</b> {mapped.description}
                  </li>
                );
              })}
            </ul>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-sm text-muted-foreground flex gap-1 items-center justify-center mb-2">
          Consenting as {session?.user.name ?? session?.user.username} (
          {session?.user.username})
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        <div className="flex justify-between gap-4 w-full">
          <Button
            variant="destructive"
            className="flex-1 font-medium transition-transform duration-200 hover:scale-105"
            onClick={() => handleAction(false)}
          >
            Deny
          </Button>
          <Button
            className="flex-1 bg-green-700 font-medium text-white hover:bg-green-800 transition-transform duration-200 hover:scale-105"
            onClick={() => handleAction(true)}
          >
            Allow
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center font-light mt-2">
          We are not affiliated with third-party applications.
        </p>
      </CardFooter>
    </Card>
  );
}
