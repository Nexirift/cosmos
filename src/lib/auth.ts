import { betterAuth, User } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, connect } from "@nexirift/db";
import {
  admin,
  bearer,
  createAuthMiddleware,
  oidcProvider,
  openAPI,
  twoFactor,
  username,
} from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
import { birthday } from "plugins/birthday-plugin";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";
import { usernameAliases } from "plugins/username-aliases-plugin";
import { env } from "@/env";
import { emailService, EmailTemplate } from "@/lib/email";
import jwt from "jsonwebtoken";

// Initialize database connection
connect();

// Create Stripe client
const stripeClient = new Stripe(env.STRIPE_SECRET_KEY || "");

/**
 * Auth configuration for Nexirift application
 */
export const auth = betterAuth({
  appName: env.APP_NAME,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, token }) => {
      // Only send verification email if user was created recently (within 10 seconds)
      const secondsSinceCreation =
        (Date.now() - new Date(user.createdAt).getTime()) / 1000;

      if (secondsSinceCreation <= 10) {
        await emailService.sendMail(
          user.email,
          "New account confirmation",
          EmailTemplate.NEW_ACCOUNT_CONFIRMATION,
          {
            name: user.name,
            url: `${process.env.BETTER_AUTH_URL}/api/auth/verify-email?token=${token}&callbackURL=${process.env.EMAIL_VERIFICATION_CALLBACK_URL || "/dashboard"}`,
          },
        );
      }
    },
  },
  user: {
    fields: {
      name: "displayName",
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, newEmail, url }) => {
        await emailService.sendMail(
          newEmail,
          "Change email confirmation",
          EmailTemplate.CHANGE_EMAIL_CONFIRMATION,
          {
            name: user.name,
            url,
          },
        );
      },
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
  plugins: [
    openAPI(),
    bearer(),
    admin(),
    username(),
    passkey({
      rpName: env.APP_NAME,
    }),
    twoFactor(),
    oidcProvider({
      loginPage: "/sign-in",
    }),
    birthday(),
    usernameAliases(),
    stripe({
      stripeClient,
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET || "",
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "nebula-individual",
            priceId: "price_1QcqyIEeEjdpOUFCuWqDcxEp",
            seats: -1,
          },
        ],
      },
    }),
  ],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (!ctx.path.startsWith("/verify-email")) {
        return;
      }

      const url = new URL(ctx.request?.url || "");
      const token = url.searchParams.get("token");

      if (!token) {
        return;
      }

      try {
        const verified = jwt.verify(token, ctx.context.secret, {
          algorithms: ["HS256"],
        }) as { email: string; updateTo?: string };

        if (!verified.updateTo) {
          return;
        }

        const user = (await ctx.context.adapter.findOne({
          model: "user",
          where: [
            {
              field: "email",
              operator: "eq",
              value: verified.updateTo,
            },
          ],
        })) as User;

        if (!user?.emailVerified) {
          await ctx.context.adapter.update({
            model: "user",
            where: [
              {
                field: "email",
                operator: "eq",
                value: verified.updateTo,
              },
            ],
            update: {
              emailVerified: true,
            },
          });

          await emailService.sendMail(
            verified.email,
            "Email changed",
            EmailTemplate.EMAIL_CHANGED,
            {
              name: user.name,
              new_email: verified.updateTo,
              whatEmail: verified.updateTo,
            },
          );
        }
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }),
  },
});

/**
 * Get all enabled auth providers by checking their environment variables
 * @returns Array of enabled provider names
 */
export const getEnabledProviders = (): Array<
  "google" | "github" | "twitter" | "twitch" | "gitlab" | "discord"
> => {
  const providers: Array<
    "google" | "github" | "twitter" | "twitch" | "gitlab" | "discord"
  > = [];

  // Check Google
  if (
    Boolean(
      env.AUTH_PROVIDER_GOOGLE_CLIENT_ID &&
        env.AUTH_PROVIDER_GOOGLE_CLIENT_SECRET,
    )
  ) {
    providers.push("google");
  }

  // Check GitHub
  if (
    Boolean(
      env.AUTH_PROVIDER_GITHUB_CLIENT_ID &&
        env.AUTH_PROVIDER_GITHUB_CLIENT_SECRET,
    )
  ) {
    providers.push("github");
  }

  // Check Twitter
  if (
    Boolean(
      env.AUTH_PROVIDER_TWITTER_CLIENT_ID &&
        env.AUTH_PROVIDER_TWITTER_CLIENT_SECRET,
    )
  ) {
    providers.push("twitter");
  }

  // Check Twitch
  if (
    Boolean(
      env.AUTH_PROVIDER_TWITCH_CLIENT_ID &&
        env.AUTH_PROVIDER_TWITCH_CLIENT_SECRET,
    )
  ) {
    providers.push("twitch");
  }

  // Check GitLab
  if (
    Boolean(
      env.AUTH_PROVIDER_GITLAB_CLIENT_ID &&
        env.AUTH_PROVIDER_GITLAB_CLIENT_SECRET &&
        env.AUTH_PROVIDER_GITLAB_ISSUER,
    )
  ) {
    providers.push("gitlab");
  }

  // Check Discord
  if (
    Boolean(
      env.AUTH_PROVIDER_DISCORD_CLIENT_ID &&
        env.AUTH_PROVIDER_DISCORD_CLIENT_SECRET,
    )
  ) {
    providers.push("discord");
  }

  return providers;
};
