"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import type { Invitation } from "@nexirift/better-auth-plugins";
import { MAX_INVITATIONS } from "@nexirift/better-auth-plugins";
import { Loader2, MoreHorizontalIcon, Plus } from "lucide-react";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

// Reusable loading button component
function LoadingButton({
  isLoading,
  text,
  className = "bg-red-500 hover:bg-red-600 text-white",
}: {
  isLoading: boolean;
  text: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {isLoading ? (
        <>
          <span className="opacity-0">{text}</span>
          <Loader2 className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin" />
        </>
      ) : (
        text
      )}
    </div>
  );
}

export function InvitationsSection() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchInvitations = useCallback(async () => {
    try {
      const { data } = await authClient.invitation.myInvites();
      setInvitations(data?.invitations || []);
    } catch (error) {
      handleError(
        error instanceof Error
          ? error
          : new Error("Failed to fetch invitations"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleCreateInvitation = async () => {
    if (isCreating) return;

    try {
      setIsCreating(true);
      const { data, error } = await authClient.invitation.create();

      if (error) {
        throw new Error(error.message || "Failed to create invitation");
      }

      setInvitations((prev) => [...prev, data.invitation]);
      toast.success("Invitation created successfully");
    } catch (error) {
      handleError(
        error instanceof Error
          ? error
          : new Error("An unexpected error occurred"),
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section id="invitations" className="flex flex-col gap-4 pt-4 border-t">
      <header className="flex flex-col gap-2 md:gap-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold">Invitations</h1>
          <Button
            onClick={handleCreateInvitation}
            variant="secondary"
            size="sm"
            disabled={isCreating || invitations.length >= MAX_INVITATIONS}
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Create Invitation
          </Button>
        </div>
        <p className="text-muted-foreground">
          Manage your invitations. Create new invitations or revoke existing
          ones.
        </p>
      </header>
      {invitations.length === 0 ? (
        <div>
          {loading ? (
            <div className="flex items-center space-x-2 text-muted-foreground p-4 border rounded-md bg-muted/10">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p>Loading invitations...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-md text-muted-foreground">
              <p className="mb-2">No invitations found.</p>
              <p className="text-sm">
                Create an invitation to allow others to join.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {invitations.map((invitation) => (
            <InvitationCard
              key={invitation.id}
              invitation={invitation}
              invitations={invitations}
              setInvitations={setInvitations}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function InvitationCard({
  invitation,
  invitations,
  setInvitations,
}: {
  invitation: Invitation;
  invitations: Invitation[];
  setInvitations: Dispatch<SetStateAction<Invitation[]>>;
}) {
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const formattedCreatedAt = new Date(
    invitation.createdAt || "",
  ).toLocaleString();
  const formattedUpdatedAt = new Date(
    invitation.updatedAt || "",
  ).toLocaleString();

  return (
    <>
      <Card className="gap-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center">
              <span className="mr-2">{invitation.code}</span>
              {invitation.userId && (
                <Badge
                  variant="outline"
                  className="bg-green-500 dark:bg-green-700"
                >
                  Accepted
                </Badge>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setIsRevokeOpen(true)}
                  className="text-red-500 focus:text-red-500"
                  disabled={!!invitation.userId}
                >
                  Revoke
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardTitle>
        </CardHeader>

        <CardFooter className="text-gray-500 text-sm flex flex-col items-start">
          <p>Created: {formattedCreatedAt}</p>
          {formattedUpdatedAt == formattedCreatedAt ? (
            <p>Not used yet.</p>
          ) : (
            <p>Used: {formattedUpdatedAt}</p>
          )}
        </CardFooter>
      </Card>

      <RevokeInvitationDialog
        invitation={invitation}
        invitations={invitations}
        setInvitations={setInvitations}
        isOpen={isRevokeOpen}
        setIsOpen={setIsRevokeOpen}
      />
    </>
  );
}

function RevokeInvitationDialog({
  invitation,
  invitations,
  setInvitations,
  isOpen,
  setIsOpen,
}: {
  invitation: Invitation;
  invitations: Invitation[];
  setInvitations: Dispatch<SetStateAction<Invitation[]>>;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevoke = async () => {
    try {
      setIsRevoking(true);
      const result = await authClient.invitation.revoke({
        invitationId: invitation.id || "",
      });

      if (result?.error) {
        const errorMessage =
          result.error.message ||
          result.error.statusText ||
          "Invitation revocation failed";
        throw new Error(errorMessage);
      }

      toast.success("Invitation revoked successfully");
      setInvitations(invitations.filter((inv) => inv.id !== invitation.id));
      setIsOpen(false);
    } catch (error) {
      handleError(
        error instanceof Error
          ? error
          : new Error("An unexpected error occurred"),
      );
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => !isRevoking && setIsOpen(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke invitation</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently revoke the invitation code{" "}
            <b>{invitation.code}</b>. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRevoke}
            disabled={isRevoking}
            className="relative bg-red-500 hover:bg-red-600 text-white"
          >
            <LoadingButton isLoading={isRevoking} text="Revoke" />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
