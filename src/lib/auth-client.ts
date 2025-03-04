"use client";

import { createAuthClient } from "better-auth/react";
import {
  usernameClient,
  passkeyClient,
  twoFactorClient,
  oidcClient,
  adminClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { birthdayClient } from "plugins/birthday-plugin/client";
import { stripeClient } from "@better-auth/stripe/client";
import { usernameAliasesClient } from "plugins/username-aliases-plugin/client";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [
    usernameClient(),
    passkeyClient(),
    twoFactorClient(),
    oidcClient(),
    adminClient(),
    birthdayClient(),
    usernameAliasesClient(),
    inferAdditionalFields({
      user: {
        birthday: {
          type: "string",
        },
      },
    }),
    stripeClient({
      subscription: true,
    }),
  ],
});
