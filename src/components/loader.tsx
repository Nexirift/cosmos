import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";

export function Loader({
  className,
  fillScreen = false,
}: {
  className?: string;
  fillScreen?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fillScreen ? "h-screen w-screen" : "h-full w-full",
        className,
      )}
    >
      <Loader2Icon className="h-8 w-8 animate-spin" />
    </div>
  );
}
