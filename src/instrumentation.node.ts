import { env } from "./env";
import { enable } from "./lib/logger";

export function register() {
  // Initialize logging
  const loggingLevels = env.LOGGING_LEVELS.split(",").filter(Boolean);
  enable(loggingLevels);
}
