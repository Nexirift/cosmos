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
          <div className="space-y-2">
            <div className="font-semibold">Nova API Server Unavailable</div>
            <div className="text-sm">
              Unable to establish connection to the core Nova API server. This
              may affect post management and related services.
            </div>
            <div className="text-sm opacity-90">
              Please check your network connection or contact your system
              administrator if the issue persists.
            </div>
          </div>
        </ModerationAlert>
      )}
    </>
  );
}
