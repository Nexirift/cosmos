import { env } from "@/env";
import { emailService, EmailTemplate } from "@/lib/email";
import { expo } from "@better-auth/expo";
import {
  birthday,
  invitation,
  usernameAliases,
  vortex,
} from "@nexirift/better-auth-plugins";
import { db } from "@/db";
import { betterAuth, BetterAuthPlugin, User } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  admin,
  bearer,
  createAuthMiddleware,
  haveIBeenPwned,
  jwt,
  multiSession,
  oidcProvider,
  openAPI,
  organization,
  twoFactor,
  username,
} from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
import { default as _jwt } from "jsonwebtoken";
import { getAllSettings, SettingsRecord } from "./actions";
import { AuthProvider } from "./types";
import { log, Logger } from "./logger";
// import { polar } from "@polar-sh/better-auth";
// import { Polar } from "@polar-sh/sdk";

// Initialize database connection
if (db.$client && db.$client.connect) {
  await db.$client.connect();
}

// Create Polar client
// const polarClient = new Polar({
//   accessToken: env.POLAR_ACCESS_TOKEN,
//   // Use 'sandbox' if you're using the Polar Sandbox environment
//   // Remember that access tokens, products, etc. are completely separated between environments.
//   // Access tokens obtained in Production are for instance not usable in the Sandbox environment.
//   server: env.NODE_ENV === "production" ? "production" : "sandbox",
// });

const config = await getAllSettings();

const nexiriftPlugins = [
  vortex(),
  birthday(),
  usernameAliases(),
  ...(env.INVITATION_DISABLED
    ? []
    : [
        invitation({
          bypassCode: env.INVITATION_BYPASS_CODE,
          maxInvitations: Number(config.maximumInvitations),
          schema: {
            invitation: {
              modelName: "cosmosInvitation",
            },
          },
        }),
      ]),
] satisfies BetterAuthPlugin[];

const betterAuthPlugins = [
  expo(),
  openAPI(),
  bearer(),
  admin(),
  username({
    usernameValidator: async (username) => {
      return new RegExp(String(config.usernameRegexValidation)).test(username);
    },
  }),
  passkey({
    rpName: String(config.appName),
  }),
  twoFactor(),
  multiSession({
    maximumSessions: 11,
  }),
  organization({
    teams: {
      enabled: true,
    },
    schema: {
      organization: {
        modelName: "organization",
      },
      member: {
        modelName: "organizationMember",
      },
      invitation: {
        modelName: "organizationInvitation",
      },
      team: {
        modelName: "organizationTeam",
      },
    },
  }),
  oidcProvider({
    loginPage: "/sign-in",
    consentPage: "/oauth/consent",
    metadata: {
      issuer: env.BETTER_AUTH_URL + "/api/auth",
    },
  }),
  jwt(),
  //haveIBeenPwned(),
  // polar({
  //   client: polarClient,
  //   createCustomerOnSignUp: true,
  //   enableCustomerPortal: true,
  //   checkout: {
  //     enabled: true,
  //     products: [
  //       {
  //         productId: "33430cb9-de73-4f8e-a05c-d95f3d959564",
  //         slug: "nebula-individual",
  //       },
  //     ],
  //     successUrl: "/success?checkout_id={CHECKOUT_ID}",
  //   },
  //   webhooks: {
  //     secret: env.POLAR_WEBHOOK_SECRET,
  //   },
  // }),
] satisfies BetterAuthPlugin[];

const plugins = [...nexiriftPlugins, ...betterAuthPlugins];

/**
 * Auth configuration for Nexirift application
 */
export const auth = betterAuth({
  appName: String(config.appName),
  trustedOrigins:
    env.NODE_ENV === "development"
      ? [
          "nexirift://",
          "http://localhost:3000",
          "http://localhost:8081",
          "exp://100.69.69.69:8081",
          "http://100.69.69.69:8081",
        ]
      : ["nexirift://"],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: Boolean(config.requireEmailVerification),
    autoSignIn: true,
    minPasswordLength: Number(config.passwordMinLength),
    maxPasswordLength: Number(config.passwordMaxLength),
    sendResetPassword: async ({ user, url }) => {
      await emailService
        .sendMail(
          user.email,
          "Reset your password",
          EmailTemplate.RESET_YOUR_PASSWORD,
          {
            name: user.name,
            url,
          },
        )
        .catch((error) =>
          log(
            `Failed to send password reset email:\n${error}`,
            Logger.LIB_AUTH,
          ),
        );
    },
  },
  emailVerification: {
    sendOnSignUp: Boolean(config.requireEmailVerification),
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, token }) => {
      try {
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
              url: `${
                env.BETTER_AUTH_URL
              }/api/auth/verify-email?token=${token}&callbackURL=${
                env.EMAIL_VERIFICATION_CALLBACK_URL
              }`,
            },
          );
        }
      } catch (error) {
        log(`Failed to send verification email:\n${error}`, Logger.LIB_AUTH);
      }
    },
  },
  user: {
    fields: {
      name: "displayName",
      image: "avatar",
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, newEmail, url }) => {
        await emailService
          .sendMail(
            newEmail,
            "Change email confirmation",
            EmailTemplate.CHANGE_EMAIL_CONFIRMATION,
            {
              name: user.name,
              url,
            },
          )
          .catch((error) =>
            log(
              `Failed to send change email confirmation:\n${error}`,
              Logger.LIB_AUTH,
            ),
          );
      },
    },
  },
  account: {
    modelName: "userAccount",
  },
  session: {
    modelName: "userSession",
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
  },
  verification: {
    modelName: "userAuthVerification",
  },
  plugins,
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Disable OIDC registration
      if (ctx.path.startsWith("/oauth2/register")) {
        if (env.ALLOW_OAUTH_REGISTRATION) return;
        return new Response(
          JSON.stringify({
            error: "OAuth2 registration is not supported",
          }),
          {
            status: 400,
          },
        );
      }
    }),
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
        const verified = _jwt.verify(token, ctx.context.secret, {
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
        log(`Failed to decode token:\n${error}`, Logger.LIB_AUTH);
      }
    }),
  },
});

/**
 * Get all enabled auth providers by checking their environment variables
 * @returns Array of enabled provider names
 */
export const getEnabledProviders = (): AuthProvider[] => {
  // Provider configurations
  const providerConfigs: Record<AuthProvider, () => boolean> = {
    google: () =>
      Boolean(
        env.AUTH_PROVIDER_GOOGLE_CLIENT_ID &&
          env.AUTH_PROVIDER_GOOGLE_CLIENT_SECRET,
      ),
    github: () =>
      Boolean(
        env.AUTH_PROVIDER_GITHUB_CLIENT_ID &&
          env.AUTH_PROVIDER_GITHUB_CLIENT_SECRET,
      ),
    twitter: () =>
      Boolean(
        env.AUTH_PROVIDER_TWITTER_CLIENT_ID &&
          env.AUTH_PROVIDER_TWITTER_CLIENT_SECRET,
      ),
    twitch: () =>
      Boolean(
        env.AUTH_PROVIDER_TWITCH_CLIENT_ID &&
          env.AUTH_PROVIDER_TWITCH_CLIENT_SECRET,
      ),
    gitlab: () =>
      Boolean(
        env.AUTH_PROVIDER_GITLAB_CLIENT_ID &&
          env.AUTH_PROVIDER_GITLAB_CLIENT_SECRET &&
          env.AUTH_PROVIDER_GITLAB_ISSUER,
      ),
    discord: () =>
      Boolean(
        env.AUTH_PROVIDER_DISCORD_CLIENT_ID &&
          env.AUTH_PROVIDER_DISCORD_CLIENT_SECRET,
      ),
  };

  // Use filter to get enabled providers
  return (Object.keys(providerConfigs) as AuthProvider[]).filter((provider) =>
    providerConfigs[provider](),
  );
};

/**
 * Plugin identifier map to maintain consistent IDs
 */
export const pluginMap = {
  username: "username",
  passkey: "passkey",
  twoFactor: "two-factor",
  oidc: "oidc",
  admin: "admin",
  birthday: "birthday",
  usernameAliases: "username-aliases",
  invitation: "invitation",
  vortex: "vortex",
  expo: "expo",
  openAPI: "open-api",
  bearer: "bearer",
  multiSession: "multi-session",
  organization: "organization",
  jwt: "jwt",
  haveIBeenPwned: "haveIBeenPwned",
} as const;

export type PluginMap = typeof pluginMap;
export type PluginKey = keyof PluginMap;
export type PluginId = PluginMap[PluginKey];
export type PluginSource = "all" | "auth" | "nexirift";

/**
 * Check if a plugin is enabled
 * @param pluginKey The plugin key to check
 * @param source Which plugin source to check (all, auth, or nexirift)
 * @returns Boolean indicating if plugin is enabled
 */
export function checkPlugin<T extends keyof PluginMap>(
  pluginKey: T,
  source: PluginSource = "all",
): boolean {
  const pluginId = getPluginId(pluginKey);

  switch (source) {
    case "auth":
      return authPlugins.some((plugin) => plugin.id === pluginId);
    case "nexirift":
      return nexiriftPlugins.some((plugin) => plugin.id === pluginId);
    default:
      return plugins.some((plugin) => plugin.id === pluginId);
  }
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
 * @param source Which plugin source to get (all, auth, or nexirift)
 * @returns Array of plugin IDs
 */
export function getEnabledPlugins(source: PluginSource = "all"): string[] {
  switch (source) {
    case "auth":
      return authPlugins.map((plugin) => plugin.id);
    case "nexirift":
      return nexiriftPlugins.map((plugin) => plugin.id);
    default:
      return plugins.map((plugin) => plugin.id);
  }
}

/**
 * Get plugin metadata for UI display
 * @returns Array of plugin metadata objects
 */
export function getPluginMetadata() {
  return Object.entries(pluginMap).map(([key, id]) => {
    const source: PluginSource = nexiriftPlugins.some(
      (plugin) => plugin.id === id,
    )
      ? "nexirift"
      : authPlugins.some((plugin) => plugin.id === id)
        ? "auth"
        : "all";

    return {
      key,
      id,
      enabled: checkPlugin(key as keyof PluginMap, source),
      source,
    };
  });
}
