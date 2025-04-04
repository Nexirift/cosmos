"use client";

import { Invite } from "@/components/invite";
import { authClient, checkPlugin } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import { useParams } from "next/navigation";
import type { InvitationWithCreator } from "@nexirift/better-auth-plugins";
import { useEffect, useState } from "react";
import { Loader } from "@/components/loader";

export default function Page() {
  const [invitationData, setInvitationData] =
    useState<InvitationWithCreator | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams<{ id: string }>();

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        setLoading(true);

        const result = await authClient.invitation.get({
          query: {
            invitationId: params.id,
          },
        });

        if (result?.error?.message) {
          throw new Error(result.error.message);
        }

        if (!result.data?.invitation) {
          throw new Error("Invitation not found");
        }

        setInvitationData({
          ...result.data.invitation,
          creator: {
            ...result.data.invitation.creator,
            image: result.data.invitation.creator.image || "",
          },
        });
      } catch (error) {
        if (error instanceof Error) {
          handleError(error);
          setError(error.message);
        } else {
          handleError(new Error("An unexpected error occurred"));
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [params.id]);

  if (loading) {
    return <Loader fillScreen />;
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        {error}
      </div>
    );
  }

  if (!checkPlugin("invitation")) {
    return (
      <div className="flex items-center h-screen justify-center font-bold text-xl">
        Invites are not enabled on this instance.
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Invite data={invitationData!} />
    </div>
  );
}
