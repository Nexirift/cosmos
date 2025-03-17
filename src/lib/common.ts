import { toast } from "sonner";

/**
 * Displays an error toast notification to the user
 * @param error The error object containing the message to display
 */
function handleError(error: Error) {
  toast.error(error.message || "An error occurred during sign in");
}

function initials(name: string = "Unknown") {
  const nameParts = name?.split(" ") || [];

  if (nameParts.length < 2) return name.slice(0, 1);

  const firstInitial = nameParts[0]?.charAt(0) || "";
  const secondInitial = nameParts[1]?.charAt(0) || "";

  return `${firstInitial}${secondInitial}`.toUpperCase();
}

export { handleError, initials };
