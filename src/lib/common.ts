import React from "react";
import { toast } from "sonner";
import { getAllSettings } from "./actions";
import { SettingKey } from "./defaults";

/**
 * Displays an error toast notification to the user
 * @param error The error object containing the message to display
 */
function handleError(error: Error) {
  toast.error(error.message || "An error occurred");
}

function initials(name: string = "Unknown") {
  const nameParts = name?.toUpperCase()?.split(" ") || [];

  if (nameParts.length < 2) return name.slice(0, 1);

  const firstInitial = nameParts[0]?.charAt(0) || "";
  const secondInitial = nameParts[1]?.charAt(0) || "";

  return `${firstInitial}${secondInitial}`.toUpperCase();
}

const useConfig = () => {
  const [config, setConfig] = React.useState<
    Partial<Record<keyof typeof SettingKey, string>>
  >({});
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchConfig = async () => {
      if (!isLoading) return;
      const result = await getAllSettings();
      setConfig(result);
      setIsLoading(false);
    };
    fetchConfig();
  }, [isLoading]);

  return { ...config, isLoading };
};

export { handleError, initials, useConfig };
