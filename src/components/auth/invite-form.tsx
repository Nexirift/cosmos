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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function InviteForm({ params }: { params: { invite: string } }) {
  const [inviteCode, setInviteCode] = useState(params.invite);
  const [isValidating, setIsValidating] = useState(false);
  const router = useRouter();

  const validateInvite = async () => {
    setIsValidating(true);
    try {
      const result = await authClient.invitation.get({
        query: {
          invitationId: inviteCode,
        },
      });

      if (result?.error?.message) {
        throw new Error(result.error.message);
      }

      if (!result.data?.invitation) {
        throw new Error("Invitation not found");
      }

      router.push(`/invite/${inviteCode}`);
    } catch (error) {
      if (error instanceof Error) {
        handleError(error);
      } else {
        handleError(new Error("An unexpected error occurred"));
      }
      setIsValidating(false);
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Join today</CardTitle>
        <CardDescription>Enter an invite code to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="code">Invite Code</Label>
            <Input
              id="code"
              placeholder="nexirift-xt0xa-ndy5r"
              maxLength={20}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          className="w-full"
          disabled={inviteCode.length < 20 || isValidating}
          onClick={validateInvite}
        >
          {isValidating ? "Checking..." : "Join Now"}
        </Button>
      </CardFooter>
    </Card>
  );
}
