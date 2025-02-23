import { toast } from "sonner";

/**
 * Displays an error toast notification to the user
 * @param error The error object containing the message to display
 */
function handleError(error: Error) {
  toast(error.message || "An error occurred during sign in");
}

export { handleError };
