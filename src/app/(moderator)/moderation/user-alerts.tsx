"use client";

import { ModerationAlert } from "@/components/moderation-alert";
// import { authClient } from "@/lib/auth-client";
import { useConfig } from "@/lib/common";
import { useEffect, useState } from "react";

export function UserAlerts({
  updateAction,
  show,
}: {
  updateAction: () => void;
  show?: boolean;
}) {
  const [connectionError, setConnectionError] = useState(false);
  const { nexiriftMode, novaUrl } = useConfig();

  // const oauth = authClient.oauth2.register({
  //   client_name: "test",
  //   redirect_uris: ["http://localhost:3000"],
  // });

  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (!nexiriftMode || !novaUrl) return;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${novaUrl}/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error("Connection failed");
        setConnectionError(false);
      } catch {
        setConnectionError(true);
        updateAction();
      }
    };
    checkConnection();
  }, [nexiriftMode, novaUrl, updateAction]);

  if (show === false) return null;

  return (
    <>
      {connectionError && (
        <ModerationAlert preset="red">
          Unable to establish connection with the Nova server. Please contact
          your system administrator immediately. Core functionalities requiring
          the Nova API, including post management and related features, are
          temporarily unavailable. We apologize for any inconvenience.
        </ModerationAlert>
      )}
    </>
  );
}
