"use client";

import { presets } from "@/components/moderation-alert";
import { Badge } from "@/components/ui/badge";
import { DrizzleError } from "drizzle-orm";
import { toast } from "sonner";

export const handleError = (e: unknown) => {
  toast.error(
    e instanceof DrizzleError || e instanceof Error
      ? e.message
      : "An unknown error occurred",
  );
};

export function VisibleBadge({ role }: { role?: string }) {
  return (
    <Badge className={presets.purple + " text-[10px] px-1 py-0.25"}>
      Visible to {role ?? "Moderators"}
    </Badge>
  );
}
