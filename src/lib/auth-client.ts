"use client";

import { env } from "@/env";
import {
  birthdayClient,
  invitationClient,
  usernameAliasesClient,
  vortexClient,
} from "@nexirift/better-auth-plugins";
import { BetterAuthClientPlugin } from "better-auth";
import {
  adminClient,
  jwtClient,
  oidcClient,
  organizationClient,
  passkeyClient,
  twoFactorClient,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { toast } from "sonner";
import { log, Logger } from "./logger";

/**
 * Initialize client-side Nexirift plugins based on configuration
 */
const nexiriftPlugins = [
  vortexClient(),
  birthdayClient(),
  usernameAliasesClient(),
  ...(env.NEXT_PUBLIC_INVITATION_DISABLED ? [] : [invitationClient()]),
] satisfies BetterAuthClientPlugin[];

/**
 * Initialize client-side auth plugins based on configuration
 */
const authPlugins = [
  adminClient(),
  usernameClient(),
  passkeyClient(),
  twoFactorClient(),
  organizationClient(),
  oidcClient(),
  jwtClient(),
] satisfies BetterAuthClientPlugin[];

// Combine all plugins
const plugins = [...nexiriftPlugins, ...authPlugins];

// Create auth client with proper error handling
export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_AUTH_BASE_URL,
  plugins,
  onError: (error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`An error occurred:\n${error}`, Logger.LIB_AUTH_CLIENT);
    toast.error(errorMessage || "Authentication error occurred");
  },
});

/**
 * Plugin identifier map to maintain consistent IDs
 */
export const pluginMap = {
  username: "username",
  passkey: "passkey",
  twoFactor: "two-factor",
  oidc: "oidc-client",
  admin: "better-auth-client",
  birthday: "birthday",
  usernameAliases: "username-aliases",
  invitation: "invitation",
  vortex: "vortex",
  organization: "organization",
} as const;

export type PluginMap = typeof pluginMap;
export type PluginKey = keyof PluginMap;
export type PluginId = PluginMap[PluginKey];

/**
 * Check if a plugin is enabled
 * @param pluginKey The plugin key to check
 * @returns Boolean indicating if plugin is enabled
 */
export function checkPlugin<T extends keyof PluginMap>(pluginKey: T): boolean {
  const pluginId = getPluginId(pluginKey);
  return plugins.some((plugin) => plugin.id === pluginId);
}

/**
 * Get the plugin ID from its key
 * @param pluginKey The plugin key
 * @returns The plugin ID
 */
function getPluginId<T extends keyof PluginMap>(pluginKey: T): PluginMap[T] {
  return pluginMap[pluginKey];
}

/**
 * Get all enabled plugin IDs
 * @returns Array of plugin IDs
 */
export function getEnabledPlugins(): string[] {
  return plugins.map((plugin) => plugin.id);
}
