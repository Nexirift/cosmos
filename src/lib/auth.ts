import { env } from "@/env";
import { emailService, EmailTemplate } from "@/lib/email";
import { expo } from "@better-auth/expo";
import {
  birthday,
  invitation,
  usernameAliases,
  vortex,
} from "@nexirift/better-auth-plugins";
import { connect, db } from "@nexirift/db";
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
import { getAllSettings } from "./actions";
// import { polar } from "@polar-sh/better-auth";
// import { Polar } from "@polar-sh/sdk";

// Initialize database connection
connect();

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

const authPlugins = [
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
  haveIBeenPwned(),
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

const plugins = [...nexiriftPlugins, ...authPlugins];

/**
 * Auth configuration for Nexirift application
 */
export const auth = betterAuth({
  appName: String(config.appName),
  trustedOrigins:
    env.NODE_ENV === "development"
      ? [
          "nexirift://",
          "http://localhost:8081",
          "exp://192.168.1.232:8081",
          "http://192.168.1.232:8081",
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
      await emailService.sendMail(
        user.email,
        "Reset your password",
        EmailTemplate.RESET_YOUR_PASSWORD,
        {
          name: user.name,
          url,
        },
      );
    },
  },
  emailVerification: {
    sendOnSignUp: Boolean(config.requireEmailVerification),
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
            url: `${
              process.env.BETTER_AUTH_URL
            }/api/auth/verify-email?token=${token}&callbackURL=${
              process.env.EMAIL_VERIFICATION_CALLBACK_URL || "/dashboard"
            }`,
          },
        );
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
};

type PluginMap = typeof pluginMap;
type PluginSource = "all" | "auth" | "nexirift";

export function checkPlugin<T extends keyof PluginMap>(
  _plugin: T,
  source: PluginSource = "all",
): boolean {
  const pluginId = getPluginId(_plugin);
  switch (source) {
    case "auth":
      return authPlugins.some((plugin) => plugin.id === pluginId);
    case "nexirift":
      return nexiriftPlugins.some((plugin) => plugin.id === pluginId);
    default:
      return plugins.some((plugin) => plugin.id === pluginId);
  }
}

function getPluginId<T extends keyof PluginMap>(_plugin: T): PluginMap[T] {
  return pluginMap[_plugin];
}

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
