import type { BetterAuthPlugin } from "better-auth";
import { APIError } from "better-auth/api";
import { createAuthMiddleware } from "better-auth/plugins";
import { schema } from "./schema";

export interface User {
  birthday?: string;
}

export const birthday = () =>
  ({
    id: "birthday",
    schema: schema,
    hooks: {
      before: [
        {
          matcher: (context) =>
            context.path === "/sign-up/email" ||
            context.path === "/update-user",
          handler: createAuthMiddleware(async (ctx) => {
            if (ctx.body?.birthday) {
              const birthday = new Date(ctx.body.birthday);
              const today = new Date();

              // Calculate age based only on date, not time
              const age = today.getFullYear() - birthday.getFullYear();
              const hasBirthdayOccurredThisYear =
                today.getMonth() > birthday.getMonth() ||
                (today.getMonth() === birthday.getMonth() &&
                  today.getDate() >= birthday.getDate());

              const adjustedAge = hasBirthdayOccurredThisYear ? age : age - 1;

              if (adjustedAge < 13) {
                throw new APIError("BAD_REQUEST", {
                  message: "You must be at least 13 years old",
                });
              }
            } else {
              throw new APIError("BAD_REQUEST", {
                message: "You must provide a birthday",
              });
            }
          }),
        },
      ],
    },
  }) satisfies BetterAuthPlugin;
