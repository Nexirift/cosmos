import { env } from "./env";
import { findImagesAndConvert } from "./lib/image";
import { enable } from "./lib/logger";

export async function register() {
  // Initialize logging
  const loggingLevels = env.LOGGING_LEVELS.split(",").filter(Boolean);
  enable(loggingLevels);

  // Convert all images :D
  await findImagesAndConvert();
}
