"use client";

import { ModerationAlert } from "@/components/moderation-alert";
import { useConfig } from "@/lib/common";
import { useEffect, useState } from "react";

export function UserAlerts({ updateAction }: { updateAction: () => void }) {
  const [connectionError, setConnectionError] = useState(false);
  const { nexiriftMode, novaUrl } = useConfig();

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
