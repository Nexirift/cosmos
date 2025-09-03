import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string(),
    DISABLE_SETUP: z.boolean().optional(),
    LOGGING_LEVELS: z.string().default("*"),
    ALLOW_OAUTH_REGISTRATION: z.boolean().default(false),

    /* Better Auth */
    BETTER_AUTH_SECRET: z.string(),

    /* Invitations */
    INVITATION_DISABLED: z.boolean().default(false),
    INVITATION_BYPASS_CODE: z.string().optional(),

    /* Subscriptions */
    POLAR_ACCESS_TOKEN: z.string().optional(),
    POLAR_WEBHOOK_SECRET: z.string().optional(),
    POLAR_PRODUCTS: z.string().optional(),

    /* Email Service */
    SMTP_HOST: z.string(),
    SMTP_PORT: z.number().or(z.string().transform(Number)),
    SMTP_AUTH_USER: z.string(),
    SMTP_AUTH_PASS: z.string(),
    SMTP_FROM: z.string().email(),
    SUPPORT_EMAIL: z.string().email(),
    EMAIL_VERIFICATION_CALLBACK_URL: z.string().default("/dashboard"),

    /* Redis Caching */
    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.number().default(6379).or(z.string().transform(Number)),
    REDIS_USERNAME: z.string().optional(),
    REDIS_PASSWORD: z.string().optional(),

    /* S3 Compatible Storage */
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

    /* CORS */
    CORS_ALLOWED_METHODS: z.string().default("GET,POST,PUT,DELETE,OPTIONS"),
    CORS_ALLOWED_ORIGINS: z.string().default("*"),
    CORS_ALLOWED_HEADERS: z.string().default("Content-Type,Authorization"),
    CORS_ALLOWED_CREDENTIALS: z.boolean().default(true),
    CORS_EXPOSED_HEADERS: z.string().optional(),

    /* Captcha */
    CAPTCHA_SECRET_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_INVITATION_DISABLED: z.boolean().default(false),
    NEXT_PUBLIC_AUTH_BASE_URL: z.string().optional(),
    NEXT_PUBLIC_POLAR_ENABLED: z.boolean().default(false),
    NEXT_PUBLIC_CAPTCHA_PROVIDER: z.string().optional(),
    NEXT_PUBLIC_CAPTCHA_SITE_KEY: z.string().optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    DISABLE_SETUP: process.env.DISABLE_SETUP === "true",
    LOGGING_LEVELS: process.env.LOGGING_LEVELS,
    ALLOW_OAUTH_REGISTRATION: process.env.ALLOW_OAUTH_REGISTRATION === "true",

    /* Better Auth */
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    NEXT_PUBLIC_AUTH_BASE_URL: process.env.NEXT_PUBLIC_AUTH_BASE_URL,

    /* Invitations */
    INVITATION_DISABLED: process.env.INVITATION_DISABLED === "true",
    INVITATION_BYPASS_CODE: process.env.INVITATION_BYPASS_CODE,
    NEXT_PUBLIC_INVITATION_DISABLED: process.env.INVITATION_DISABLED === "true",

    /* Subscriptions */
    POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
    POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
    POLAR_PRODUCTS: process.env.POLAR_PRODUCTS,
    NEXT_PUBLIC_POLAR_ENABLED: process.env.POLAR_ACCESS_TOKEN !== undefined,

    /* Email Service */
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_AUTH_USER: process.env.SMTP_AUTH_USER,
    SMTP_AUTH_PASS: process.env.SMTP_AUTH_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    EMAIL_VERIFICATION_CALLBACK_URL:
      process.env.EMAIL_VERIFICATION_CALLBACK_URL,

    /* Redis Caching */
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_USERNAME: process.env.REDIS_USERNAME,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,

    /* S3 Compatible Storage */
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

    /* CORS */
    CORS_ALLOWED_METHODS: process.env.CORS_ALLOWED_METHODS,
    CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
    CORS_ALLOWED_HEADERS: process.env.CORS_ALLOWED_HEADERS,
    CORS_ALLOWED_CREDENTIALS: process.env.CORS_ALLOWED_CREDENTIALS,
    CORS_EXPOSED_HEADERS: process.env.CORS_EXPOSED_HEADERS,

    /* Captcha */
    NEXT_PUBLIC_CAPTCHA_PROVIDER: process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER,
    NEXT_PUBLIC_CAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY,
    CAPTCHA_SECRET_KEY: process.env.CAPTCHA_SECRET_KEY,
  },
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION || process.env.NODE_ENV === "test",
});
