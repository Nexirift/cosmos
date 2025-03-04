import type { BetterAuthPlugin } from "better-auth";
import { createAuthMiddleware } from "better-auth/plugins";

export const vortex = () =>
  ({
    id: "vortex",
    schema: {
      user: {
        fields: {
          birthday: {
            type: "date",
            required: true,
            unique: false,
            references: undefined,
          },
        },
      },
    },
    hooks: {
      before: [
        {
          matcher: (context) => context.path.startsWith("/sign-up/email"),
          handler: createAuthMiddleware(async (ctx) => {
            return {
              context: ctx,
            };
          }),
        },
      ],
    },
  }) satisfies BetterAuthPlugin;
