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
import { Session } from "better-auth";
import { Loader2, MoreHorizontalIcon } from "lucide-react";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { LoadingButton } from "../loading";

interface SessionData extends Session {
  current?: boolean;
}

interface DeviceInfo {
  browser: string;
  device: string;
}

export function SessionsSection({
  session,
}: {
  session: ReturnType<typeof authClient.useSession>["data"] | undefined;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRevokeOtherOpen, setIsRevokeOtherOpen] = useState(false);
  const [isRevokeAllOpen, setIsRevokeAllOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await authClient.listSessions();
      setSessions(data || []);
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error("Failed to fetch sessions"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeOtherSessions = async () => {
    try {
      setIsRevoking(true);
      const { error } = await authClient.revokeOtherSessions();

      if (error) {
        throw new Error(error.message || "Failed to revoke other sessions");
      }

      // Keep only the current session
      setSessions(sessions.filter((s) => s.id === session?.session.id));
      toast.success("Other sessions revoked successfully");
      setIsRevokeOtherOpen(false);
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

  const handleRevokeAllSessions = async () => {
    try {
      setIsRevoking(true);
      const { error } = await authClient.revokeSessions();

      if (error) {
        throw new Error(error.message || "Failed to revoke all sessions");
      }

      setSessions([]);
      toast.success("All sessions revoked successfully");
      setIsRevokeAllOpen(false);
      // Note: The user will likely be logged out after this action
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

  const sessionsList = useMemo(() => {
    return sessions.map((sessionData) => (
      <SessionCard
        key={sessionData.id}
        session={{
          ...sessionData,
          current: sessionData.id === session?.session.id,
        }}
        sessions={sessions}
        setSessions={setSessions}
      />
    ));
  }, [sessions, session?.session.id]);

  return (
    <section id="sessions" className="flex flex-col gap-4 pt-4 border-t">
      <header className="flex flex-col gap-2 md:gap-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold">Sessions</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => setIsRevokeOtherOpen(true)}
              variant="secondary"
              size="sm"
              disabled={sessions.length <= 1}
            >
              Revoke Other Sessions
            </Button>
            <Button
              onClick={() => setIsRevokeAllOpen(true)}
              variant="secondary"
              size="sm"
              disabled={sessions.length === 0}
            >
              Revoke All Sessions
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Manage your active sessions, and use actions such as revoking to avoid
          session hijacking.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          <p className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading sessions...
          </p>
        ) : sessions.length === 0 ? (
          <p>No active sessions found.</p>
        ) : (
          sessionsList
        )}
      </div>

      {/* Revoke Other Sessions Dialog */}
      <AlertDialog
        open={isRevokeOtherOpen}
        onOpenChange={(open) => !isRevoking && setIsRevokeOtherOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke other sessions</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently revoke all sessions except your current one.
              Users on other devices will be signed out.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeOtherSessions}
              disabled={isRevoking}
              className="relative bg-red-500 hover:bg-red-600 text-white"
            >
              <LoadingButton isLoading={isRevoking} text="Revoke Other" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke All Sessions Dialog */}
      <AlertDialog
        open={isRevokeAllOpen}
        onOpenChange={(open) => !isRevoking && setIsRevokeAllOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke all sessions</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently revoke all sessions including your current
              one. You will be signed out immediately after confirmation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAllSessions}
              disabled={isRevoking}
              className="relative bg-red-500 hover:bg-red-600 text-white"
            >
              <LoadingButton isLoading={isRevoking} text="Revoke All" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function SessionCard({
  session,
  sessions,
  setSessions,
}: {
  session: SessionData;
  sessions: Session[];
  setSessions: Dispatch<SetStateAction<Session[]>>;
}) {
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);

  // Calculate expiry details
  const expiryDays = useMemo(() => {
    const expiryTime = new Date(session.expiresAt).getTime();
    return Math.ceil((expiryTime - Date.now()) / (1000 * 60 * 60 * 24));
  }, [session.expiresAt]);

  // Parse user agent to show device/browser information
  const deviceInfo = useMemo(
    () =>
      session.userAgent
        ? parseUserAgent(session.userAgent)
        : { browser: "Unknown", device: "Unknown" },
    [session.userAgent],
  );

  return (
    <>
      <Card className="gap-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center">
              {deviceInfo.browser} on {deviceInfo.device}
              {session.current && (
                <Badge variant="secondary" className="ml-2">
                  Current
                </Badge>
              )}
            </div>
            {!session.current ? (
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
                  >
                    Revoke
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="h-8 w-8 p-0" />
            )}
          </CardTitle>
        </CardHeader>

        <CardFooter className="text-gray-500 text-sm flex flex-col items-start">
          <p>Created: {new Date(session.createdAt).toLocaleString()}</p>
          <p>
            Expires: {new Date(session.expiresAt).toLocaleString()} (
            {expiryDays} days)
          </p>
        </CardFooter>
      </Card>

      <RevokeSessionDialog
        session={session}
        sessions={sessions}
        setSessions={setSessions}
        isOpen={isRevokeOpen}
        setIsOpen={setIsRevokeOpen}
      />
    </>
  );
}

// Helper function to parse user agent string
function parseUserAgent(userAgent: string): DeviceInfo {
  // Browser detection
  const browserPatterns = {
    Firefox: /Firefox/i,
    Chrome: /Chrome/i,
    Safari: /Safari/i,
    Edge: /Edge|Edg/i, // Added Edg pattern for newer Edge versions
    Opera: /Opera|OPR/i, // Added OPR pattern for newer Opera versions
  };

  let browser = "Unknown";
  for (const [name, pattern] of Object.entries(browserPatterns)) {
    if (pattern.test(userAgent)) {
      browser = name;
      break;
    }
  }

  // Device detection
  const devicePatterns = {
    iPhone: /iPhone/i,
    iPad: /iPad/i,
    "Android Device": /Android/i,
    "Windows PC": /Windows NT/i,
    Mac: /Macintosh|Mac OS X/i,
    Linux: /Linux/i,
  };

  let device = "Unknown Device";
  for (const [name, pattern] of Object.entries(devicePatterns)) {
    if (pattern.test(userAgent)) {
      device = name;
      break;
    }
  }

  return { browser, device };
}

function RevokeSessionDialog({
  session,
  sessions,
  setSessions,
  isOpen,
  setIsOpen,
}: {
  session: { id: string; token: string; userAgent?: string | null | undefined };
  sessions: Session[];
  setSessions: Dispatch<SetStateAction<Session[]>>;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevoke = async () => {
    try {
      setIsRevoking(true);
      const result = await authClient.revokeSession({ token: session.token });

      if (result?.error) {
        const errorMessage =
          result.error.message ||
          result.error.statusText ||
          "Session revocation failed";
        throw new Error(errorMessage);
      }

      toast.success("Session revoked successfully");
      setSessions(sessions.filter((s) => s.token !== session.token));
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
          <AlertDialogTitle>Revoke session</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently revoke the session from your account.
            You&#39;ll no longer be able to use it to sign in.
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
