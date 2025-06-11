"use client";

import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";

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
          <Loader2Icon className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin" />
        </>
      ) : (
        text
      )}
    </div>
  );
}

export function LoadingButtonWithText({
  isLoading,
  disabled,
  onClick,
  loadingText,
  children,
  type = "button",
}: {
  isLoading: boolean;
  disabled?: boolean;
  onClick?: () => void;
  loadingText: string;
  children?: React.ReactNode;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className="relative"
    >
      {isLoading ? (
        <>
          <span className="opacity-0">{loadingText || children}</span>
          <Loader2Icon className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-spin" />
        </>
      ) : (
        loadingText || children
      )}
    </Button>
  );
}
