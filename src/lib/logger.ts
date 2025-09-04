import debug from "debug";

/**
 * Enum of logger namespaces for different system components
 */
export enum Logger {
  ALL = "*",
  LIB_AUTH = "lib:auth",
  LIB_AUTH_CLIENT = "lib:auth:client",
  LIB_EMAIL = "lib:email",
  LIB_REDIS = "ioredis:redis",
  LIB_CACHE = "lib:cache",
  LIB_SETTINGS = "lib:settings",
  LIB_DB = "lib:db",
  APP_UPLOAD = "app:upload",
  COMPONENT_INVITE = "component:invite",
  MODERATION_PROTECT = "moderation:protect",
  MODERATION_ROLE = "moderation:role",
  OTHER = "unknown",
}

/**
 * Log a message to the specified logger namespace
 * @param message - The message to log
 * @param namespace - The logger namespace to use
 */
export function log(message: string, namespace: Logger | string): void {
  debug(namespace)(message);
}

/**
 * Enable debug output for the specified namespaces
 * @param namespaces - Array of logger namespaces to enable
 */
export function enable(namespaces: (Logger | string)[]): void {
  debug.enable(namespaces.join(","));
}
