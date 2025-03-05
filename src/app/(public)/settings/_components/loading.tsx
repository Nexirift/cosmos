"use client";

import { Loader2 } from "lucide-react";

export function LoadingButton({
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
