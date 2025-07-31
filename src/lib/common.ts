import React from "react";
import { toast } from "sonner";
import { getAllSettings } from "./actions";
import { ApiError } from "./types";

/**
 * Displays an error toast notification to the user
 * @param error The error object containing the message to display
 * @param options Additional options for error handling
 */
function handleError(
  error: Error | ApiError | unknown,
  options: {
    fallbackMessage?: string;
    logToConsole?: boolean;
    reportToService?: boolean;
  } = {},
) {
  const {
    fallbackMessage = "An error occurred",
    logToConsole = true,
    reportToService = false,
  } = options;

  // Extract error message based on error type
  let errorMessage: string;

  if (error instanceof Error) {
    errorMessage = error.message || fallbackMessage;
  } else if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    errorMessage = (error as { message: string }).message || fallbackMessage;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else {
    errorMessage = fallbackMessage;
  }

  // Display toast
  toast.error(errorMessage);

  // Additional error handling
  if (logToConsole) {
    log(`An error occurred:\n${error}`, Logger.OTHER);
  }

  if (reportToService) {
    // Implement error reporting service integration here
    // Example: errorReportingService.report(error);
  }
}

/**
 * Generates initials from a person's name
 * @param name The person's name
 * @param fallback Fallback string if name is invalid
 * @returns Formatted initials (1-2 characters)
 */
function initials(name: string = "Unknown", fallback: string = "?") {
  if (!name || typeof name !== "string") return fallback;

  // Trim and normalize the name
  const trimmedName = name.trim();
  if (!trimmedName) return fallback;

  const nameParts = trimmedName.toUpperCase().split(/\s+/).filter(Boolean);

  if (nameParts.length < 2) {
    // Handle single name or single character
    return nameParts[0]?.charAt(0) || fallback;
  }

  const firstInitial = nameParts[0]?.charAt(0) || "";
  const secondInitial = nameParts[1]?.charAt(0) || "";

  return `${firstInitial}${secondInitial}`;
}

import { SettingsRecord } from "./types";
import { log, Logger } from "./logger";

/**
 * Hook to access application configuration
 * @param options Configuration options
 * @returns Configuration settings and loading state
 */
const useConfig = (
  options: {
    revalidateInterval?: number;
    suspense?: boolean;
  } = {},
) => {
  const { revalidateInterval = 0, suspense = false } = options;

  const [config, setConfig] = React.useState<SettingsRecord>(
    {} as SettingsRecord,
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // For suspense support
  const promiseRef = React.useRef<Promise<SettingsRecord> | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | undefined;

    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        const result = await getAllSettings();

        if (isMounted) {
          setConfig(result);
          setError(null);
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          log(`Failed to load configuration:\n${error}`, Logger.LIB_SETTINGS);
          setError(error instanceof Error ? error : new Error(String(error)));
          setIsLoading(false);
        }
      }
    };

    fetchConfig();

    // Set up revalidation interval if specified
    if (revalidateInterval > 0) {
      intervalId = setInterval(fetchConfig, revalidateInterval);
    }

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [revalidateInterval]);

  // Support for React Suspense
  if (suspense && isLoading) {
    if (!promiseRef.current) {
      promiseRef.current = getAllSettings();
    }
    throw promiseRef.current;
  }

  return {
    ...config,
    isLoading,
    error,
    refresh: React.useCallback(() => setIsLoading(true), []),
  };
};

/**
 * Formats a value for display based on its type
 * @param value The value to format
 * @returns Formatted string representation
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[Object]";
    }
  }

  return String(value);
}

export const oauthScopeMap = {
  openid: {
    friendlyName: "OpenID Connect",
    description: "Allows the application to authenticate your account.",
  },
  profile: {
    friendlyName: "Profile",
    description:
      "Allows the application to retrieve your name and profile picture.",
  },
  email: {
    friendlyName: "Email",
    description: "Allows the application to retrieve your email address.",
  },
};

export { handleError, initials, useConfig, formatValue };
