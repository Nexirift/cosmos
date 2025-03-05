"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { env } from "@/env";
import { InvitationWithCreator } from "plugins/invitation-plugin/schema";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function Invite({ data }: { data: InvitationWithCreator }) {
  const [declined, setDeclined] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const router = useRouter();

  const handleDecline = async () => {
    try {
      setIsRevoking(true);
      await authClient.invitation.revoke({ invitationId: data.id! });
      setDeclined(true);
    } catch (error) {
      console.error("Failed to decline invitation:", error);
    } finally {
      setIsRevoking(false);
    }
  };

  function initials() {
    const nameParts = data.creator.name?.split(" ") || [];

    if (nameParts.length < 2) return data.creator.name.slice(0, 1);

    const firstInitial = nameParts[0]?.charAt(0) || "";
    const secondInitial = nameParts[1]?.charAt(0) || "";

    return `${firstInitial}${secondInitial}`.toUpperCase();
  }

  return (
    <Card className="max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300 relative">
      {declined && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white text-xl font-semibold rounded-xl z-10">
          You declined the invitation.
        </div>
      )}
      <CardHeader className="space-y-4">
        <CardTitle className="text-2xl font-bold text-center">
          You have been invited!
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Avatar className="w-6 h-6 ring-2 ring-gray-600">
            <AvatarImage src={data.creator.image} />
            <AvatarFallback>{initials()}</AvatarFallback>
          </Avatar>
          {data.creator.name} has invited you to join{" "}
          {env.NEXT_PUBLIC_APP_NAME ?? "Cosmos"}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 justify-center items-center">
          <Button
            className="bg-green-600 hover:bg-green-700 text-neutral-50 font-medium transition-colors duration-200"
            onClick={() => {
              router.push(`/join?invite=${data.code}`);
            }}
          >
            Accept
          </Button>
          <Button
            variant="destructive"
            className="font-medium hover:bg-red-700 transition-colors duration-200"
            onClick={handleDecline}
            disabled={isRevoking || declined}
          >
            {isRevoking ? "Declining..." : "Decline"}
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <Label className="text-gray-500 text-sm text-center w-full">
          {env.NEXT_PUBLIC_APP_NAME} is currently in a private alpha phase.
        </Label>
      </CardFooter>
    </Card>
  );
}
