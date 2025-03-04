import type { BetterAuthPlugin, User } from "better-auth";
import { APIError } from "better-auth/api";
import { createAuthMiddleware } from "better-auth/plugins";

export const usernameAliases = (): BetterAuthPlugin => ({
  id: "usernameAliasesPlugin",
  schema: {
    user: {
      fields: {
        usernameAliases: {
          type: "string",
          required: false,
          unique: false,
          references: undefined,
        },
      },
    },
  },
  hooks: {
    before: [
      {
        matcher: (context) =>
          context.path === "/sign-up/email" || context.path === "/update-user",
        handler: createAuthMiddleware(async (ctx) => {
          const username = ctx.body.username?.toLowerCase();
          const usernameAliases = ctx.body.usernameAliases;

          if (!username && !usernameAliases) {
            return { context: ctx };
          }

          if (username) {
            const existing = await ctx.context.adapter.findOne<
              User & { usernameAliases: string[] }
            >({
              model: "user",
              where: [
                {
                  field: "usernameAliases",
                  operator: "contains",
                  value: `"${username}"`,
                },
              ],
            });

            if (existing) {
              throw new APIError("UNPROCESSABLE_ENTITY", {
                message:
                  "Username is already taken as an alias. Please try another.",
              });
            }
          }

          if (usernameAliases) {
            const existing = await ctx.context.adapter.findOne<
              User & { usernameAliases: string[] }
            >({
              model: "user",
              where: [
                {
                  field: "usernameAliases",
                  operator: "eq",
                  value: usernameAliases,
                },
              ],
            });

            if (existing) {
              throw new APIError("UNPROCESSABLE_ENTITY", {
                message: "Username alias is already taken. Please try another.",
              });
            }
          }

          return { context: ctx };
        }),
      },
    ],
  },
});
