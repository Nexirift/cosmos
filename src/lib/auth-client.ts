"use client";

import { createAuthClient } from "better-auth/react";
import {
  usernameClient,
  passkeyClient,
  twoFactorClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [usernameClient(), passkeyClient(), twoFactorClient()],
});
