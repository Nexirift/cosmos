import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, connect } from "@nexirift/db";
import { admin, bearer, openAPI, username } from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";

connect();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    fields: {
      name: "displayName",
    },
  },
  account: {
    modelName: "userAccount",
  },
  session: {
    modelName: "userSession",
  },
  verification: {
    modelName: "userAuthVerification",
  },
  plugins: [openAPI(), bearer(), admin(), username(), passkey()],
});
