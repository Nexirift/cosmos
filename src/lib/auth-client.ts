"use client";

import { createAuthClient } from "better-auth/react";
import {
  usernameClient,
  passkeyClient,
  twoFactorClient,
  oidcClient,
  adminClient,
} from "better-auth/client/plugins";
import { birthdayClient } from "plugins/birthday-plugin/client";
import { usernameAliasesClient } from "plugins/username-aliases-plugin/client";
import { BetterAuthClientPlugin } from "better-auth";
import { invitationClient } from "plugins/invitation-plugin/client";

const plugins = [
  usernameClient(),
  passkeyClient(),
  twoFactorClient(),
  oidcClient(),
  adminClient(),
  birthdayClient(),
  usernameAliasesClient(),
  invitationClient(),
] satisfies BetterAuthClientPlugin[];

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
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
