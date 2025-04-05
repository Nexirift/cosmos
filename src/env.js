import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string(),
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.string().url(),
    POLAR_ACCESS_TOKEN: z.string().optional(),
    POLAR_WEBHOOK_SECRET: z.string().optional(),
    SMTP_HOST: z.string(),
    SMTP_PORT: z.number().or(z.string().transform(Number)),
    SMTP_AUTH_USER: z.string(),
    SMTP_AUTH_PASS: z.string(),
    SMTP_FROM: z.string().email(),
    SUPPORT_EMAIL: z.string().email(),
    INVITATION_DISABLED: z.boolean().default(false),
    INVITATION_BYPASS_CODE: z.string().optional(),
    ALLOW_OAUTH_REGISTRATION: z.boolean().default(false),
    DISABLE_SETUP: z.boolean().optional(),

    /* AWS */
    S3_STORAGE_ACCESS_KEY_ID: z.string().optional(),
    S3_STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
    S3_STORAGE_ENDPOINT: z.string().optional(),
    S3_STORAGE_REGION: z.string().optional(),
    S3_STORAGE_BUCKET: z.string().optional(),
    S3_STORAGE_FORCE_PATH_STYLE: z.boolean().optional(),

    /* Auth Providers */
    AUTH_PROVIDER_GOOGLE_CLIENT_ID: z.string().optional(),
    AUTH_PROVIDER_GOOGLE_CLIENT_SECRET: z.string().optional(),

    AUTH_PROVIDER_GITHUB_CLIENT_ID: z.string().optional(),
    AUTH_PROVIDER_GITHUB_CLIENT_SECRET: z.string().optional(),

    AUTH_PROVIDER_TWITTER_CLIENT_ID: z.string().optional(),
    AUTH_PROVIDER_TWITTER_CLIENT_SECRET: z.string().optional(),

    AUTH_PROVIDER_TWITCH_CLIENT_ID: z.string().optional(),
    AUTH_PROVIDER_TWITCH_CLIENT_SECRET: z.string().optional(),

    AUTH_PROVIDER_GITLAB_CLIENT_ID: z.string().optional(),
    AUTH_PROVIDER_GITLAB_CLIENT_SECRET: z.string().optional(),
    AUTH_PROVIDER_GITLAB_ISSUER: z.string().optional(),

    AUTH_PROVIDER_DISCORD_CLIENT_ID: z.string().optional(),
    AUTH_PROVIDER_DISCORD_CLIENT_SECRET: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_INVITATION_DISABLED: z.boolean().default(false),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
    POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_AUTH_USER: process.env.SMTP_AUTH_USER,
    SMTP_AUTH_PASS: process.env.SMTP_AUTH_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    INVITATION_DISABLED: process.env.INVITATION_DISABLED === "true",
    INVITATION_BYPASS_CODE: process.env.INVITATION_BYPASS_CODE,
    NEXT_PUBLIC_INVITATION_DISABLED: process.env.INVITATION_DISABLED === "true",
    ALLOW_OAUTH_REGISTRATION: process.env.ALLOW_OAUTH_REGISTRATION === "true",
    DISABLE_SETUP:
      process.env.DISABLE_SETUP === undefined
        ? undefined
        : process.env.DISABLE_SETUP === "true",

    /* AWS */
    S3_STORAGE_ACCESS_KEY_ID: process.env.S3_STORAGE_ACCESS_KEY_ID,
    S3_STORAGE_SECRET_ACCESS_KEY: process.env.S3_STORAGE_SECRET_ACCESS_KEY,
    S3_STORAGE_ENDPOINT: process.env.S3_STORAGE_ENDPOINT,
    S3_STORAGE_REGION: process.env.S3_STORAGE_REGION,
    S3_STORAGE_BUCKET: process.env.S3_STORAGE_BUCKET,
    S3_STORAGE_FORCE_PATH_STYLE:
      process.env.S3_STORAGE_FORCE_PATH_STYLE === "true",

    /* Auth Providers */
    AUTH_PROVIDER_GOOGLE_CLIENT_ID: process.env.AUTH_PROVIDER_GOOGLE_CLIENT_ID,
    AUTH_PROVIDER_GOOGLE_CLIENT_SECRET:
      process.env.AUTH_PROVIDER_GOOGLE_CLIENT_SECRET,

    AUTH_PROVIDER_GITHUB_CLIENT_ID: process.env.AUTH_PROVIDER_GITHUB_CLIENT_ID,
    AUTH_PROVIDER_GITHUB_CLIENT_SECRET:
      process.env.AUTH_PROVIDER_GITHUB_CLIENT_SECRET,

    AUTH_PROVIDER_TWITTER_CLIENT_ID:
      process.env.AUTH_PROVIDER_TWITTER_CLIENT_ID,
    AUTH_PROVIDER_TWITTER_CLIENT_SECRET:
      process.env.AUTH_PROVIDER_TWITTER_CLIENT_SECRET,

    AUTH_PROVIDER_TWITCH_CLIENT_ID: process.env.AUTH_PROVIDER_TWITCH_CLIENT_ID,
    AUTH_PROVIDER_TWITCH_CLIENT_SECRET:
      process.env.AUTH_PROVIDER_TWITCH_CLIENT_SECRET,

    AUTH_PROVIDER_GITLAB_CLIENT_ID: process.env.AUTH_PROVIDER_GITLAB_CLIENT_ID,
    AUTH_PROVIDER_GITLAB_CLIENT_SECRET:
      process.env.AUTH_PROVIDER_GITLAB_CLIENT_SECRET,
    AUTH_PROVIDER_GITLAB_ISSUER: process.env.AUTH_PROVIDER_GITLAB_ISSUER,

    AUTH_PROVIDER_DISCORD_CLIENT_ID:
      process.env.AUTH_PROVIDER_DISCORD_CLIENT_ID,
    AUTH_PROVIDER_DISCORD_CLIENT_SECRET:
      process.env.AUTH_PROVIDER_DISCORD_CLIENT_SECRET,
  },
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION || process.env.NODE_ENV === "test",
});
