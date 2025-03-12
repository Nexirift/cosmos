/**
 * Error codes for the Vortex plugin
 * Organized by category for better maintainability
 */
export const VORTEX_ERROR_CODES = {
  // Authentication & Authorization errors
  UNAUTHORIZED: "You must be logged in to perform this action",
  FORBIDDEN: "You don't have permission to perform this action",
  USER_NOT_FOUND: "User not found",

  // Permission-related errors
  INVALID_PERMISSION_CHECK:
    "Invalid permission check. You can only check one resource permission at a time.",

  // Violation-related errors
  VIOLATION_NOT_FOUND: "Violation record not found",
  VIOLATION_CREATE_FAILED: "Failed to create violation record",
  VIOLATION_LIST_FAILED: "Failed to retrieve violations",
  VIOLATION_DELETE_FAILED: "Failed to delete violation record",
  VIOLATION_UPDATE_FAILED: "Failed to update violation record",
  VIOLATION_PERMISSION_DENIED:
    "You don't have permission to manage this violation",

  // Dispute-related errors
  DISPUTE_NOT_FOUND: "Dispute record not found",
  DISPUTE_CREATE_FAILED: "Failed to create dispute record",
  DISPUTE_LIST_FAILED: "Failed to retrieve disputes",
  DISPUTE_DELETE_FAILED: "Failed to delete dispute record",
  DISPUTE_UPDATE_FAILED: "Failed to update dispute record",
  DISPUTE_ALREADY_OVERTURNED: "This violation has already been overturned",
  DISPUTE_ALREADY_EXISTS: "This violation has already been disputed",
  DISPUTE_STATUS_REJECTED: "This dispute has already been rejected",
  DISPUTE_STATUS_APPROVED: "This dispute has already been approved",

  // General errors
  BAD_REQUEST: "Invalid request parameters",
} as const;
