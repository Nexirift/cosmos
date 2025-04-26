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

const nexiriftPlugins = [
  vortexClient(),
  birthdayClient(),
  usernameAliasesClient(),
  ...(env.NEXT_PUBLIC_INVITATION_DISABLED ? [] : [invitationClient()]),
] satisfies BetterAuthClientPlugin[];

const authPlugins = [
  adminClient(),
  usernameClient(),
  passkeyClient(),
  twoFactorClient(),
  organizationClient(),
  oidcClient(),
  jwtClient(),
] satisfies BetterAuthClientPlugin[];

const plugins = [...nexiriftPlugins, ...authPlugins];

export const authClient = createAuthClient({
  baseURL: "http://100.69.69.69:3000",
  plugins,
});

export const pluginMap = {
  username: "username",
  passkey: "passkey",
  twoFactor: "two-factor",
  oidc: "oidc-client",
  admin: "better-auth-client",
  birthday: "birthday",
  usernameAliases: "username-aliases",
  invitation: "invitation",
  additionalFields: "additional-fields-client",
  stripe: "stripe-client",
};

type PluginMap = typeof pluginMap;

export function checkPlugin<T extends keyof PluginMap>(_plugin: T): boolean {
  const pluginId = getPluginId(_plugin);
  return plugins.some((plugin) => plugin.id === pluginId);
}

function getPluginId<T extends keyof PluginMap>(_plugin: T): PluginMap[T] {
  return pluginMap[_plugin];
}
