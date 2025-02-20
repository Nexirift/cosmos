import { toast } from "@/hooks/use-toast";

/**
 * Displays an error toast notification to the user
 * @param error The error object containing the message to display
 */
function handleError(error: Error) {
  toast({
    description: error.message || "An error occurred during sign in",
    variant: "destructive",
    duration: 3000,
  });
}

export { handleError };
