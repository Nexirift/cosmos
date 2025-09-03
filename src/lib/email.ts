import * as nodemailer from "nodemailer";
import * as fs from "node:fs";
import * as path from "node:path";
import { env } from "@/env";
import { checkCache } from "./actions";
import { SettingKey } from "./defaults";
import { LRUCache } from "lru-cache";
import { log, Logger } from "./logger";

/**
 * Enum for available email templates
 */
export enum EmailTemplate {
  NEW_ACCOUNT_CONFIRMATION = "new-account-confirmation",
  CHANGE_EMAIL_CONFIRMATION = "change-email-confirmation",
  EMAIL_CHANGED = "email-changed",
  RESET_YOUR_PASSWORD = "reset-your-password",
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly templateDir = path.join(
    process.cwd(),
    "node_modules/@nexirift/emails/dist",
  );
  private readonly templateCache: LRUCache<string, string>;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000; // ms

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      from: env.SMTP_FROM,
      port: env.SMTP_PORT,
      auth: {
        user: env.SMTP_AUTH_USER,
        pass: env.SMTP_AUTH_PASS,
      },
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000, // 1 second
      rateLimit: 5, // 5 messages per second
    });

    // Initialize template cache
    this.templateCache = new LRUCache<string, string>({
      max: 20, // Maximum number of templates to cache
      ttl: 1000 * 60 * 60, // 1 hour cache TTL
    });

    // Verify connection configuration
    this.transporter.verify((error) => {
      if (error) {
        log(`Connection error:\n${error}`, Logger.LIB_EMAIL);
      } else {
        log(`Ready to send messages`, Logger.LIB_EMAIL);
      }
    });
  }

  /**
   * Parse template with dynamic variables
   */
  private async parseDynamicTemplate(
    dynamicVariables: Record<string, unknown>,
    templateName: EmailTemplate | string,
  ): Promise<string> {
    const templatePath = path.join(this.templateDir, templateName + ".html");
    const cacheKey = `template:${templateName}`;

    // Get default variables in parallel with template loading
    const defaultVariablesPromise = Promise.all([
      checkCache(SettingKey.appName),
      checkCache(SettingKey.appLogo),
    ]).then(([appName, appLogo]) => ({
      app_name: appName,
      app_logo: appLogo,
      home_url: env.NEXT_PUBLIC_AUTH_BASE_URL,
      support_email: env.SUPPORT_EMAIL,
    }));

    // Try to get template from cache first
    let template = this.templateCache.get(cacheKey);

    if (!template) {
      try {
        template = fs.readFileSync(templatePath, "utf-8");
        // Store in cache for future use
        this.templateCache.set(cacheKey, template);
      } catch (error) {
        log(
          `Failed to read email template: ${templatePath}\n${error}`,
          Logger.LIB_EMAIL,
        );
        throw new Error(
          `Email template not found or inaccessible: ${templateName}`,
        );
      }
    }

    const defaultVariables = await defaultVariablesPromise;
    const variables = { ...defaultVariables, ...dynamicVariables };

    try {
      return Object.entries(variables).reduce(
        (result, [key, value]) =>
          result.replaceAll(`{{ $${key} }}`, value?.toString() ?? ""),
        template!,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      log(
        `Failed to parse template variables for: ${templateName}\n${error}`,
        Logger.LIB_EMAIL,
      );

      throw new Error(`Error parsing template variables: ${errorMessage}`);
    }
  }

  /**
   * Send an email with HTML template
   * @param to Recipient email address
   * @param subject Email subject
   * @param template Template name to use
   * @param variables Template variables
   * @param text Optional plain text version
   * @returns Promise resolving to sent message info
   */
  public async sendMail(
    to: string,
    subject: string,
    template: EmailTemplate | string,
    variables: Record<string, unknown> = {},
    text?: string,
  ): Promise<nodemailer.SentMessageInfo> {
    // Validate email address
    if (!to || !to.includes("@")) {
      throw new Error("Invalid recipient email address");
    }

    // Generate HTML content from template
    const html = await this.parseDynamicTemplate(variables, template);

    const fallbackText = text
      ? `${text}\n\nNote: This version of the email only shows up if your email client couldn't render the HTML content.`
      : "Please use an HTML-capable email client to view this message.";

    const mailOptions = {
      to,
      subject,
      text: fallbackText,
      html,
      from: env.SMTP_FROM,
      headers: {
        "X-Application": "Cosmos",
      },
    };

    // Send with retry logic
    return this.sendWithRetry(mailOptions);
  }

  /**
   * Send email with retry logic
   * @param mailOptions Email options
   * @param attempt Current attempt number
   * @returns Promise resolving to sent message info
   */
  private async sendWithRetry(
    mailOptions: nodemailer.SendMailOptions,
    attempt = 1,
  ): Promise<nodemailer.SentMessageInfo> {
    try {
      return await this.transporter.sendMail(mailOptions);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (attempt < this.MAX_RETRY_ATTEMPTS) {
        log(
          `Retry attempt ${attempt} for ${mailOptions.to}:\n${errorMessage}`,
          Logger.LIB_EMAIL,
        );

        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, this.RETRY_DELAY * attempt),
        );

        return this.sendWithRetry(mailOptions, attempt + 1);
      }

      log(
        `Failed to send email to ${mailOptions.to} after ${attempt} attempts:\n${errorMessage}`,
        Logger.LIB_EMAIL,
      );

      throw error;
    }
  }
}

export const emailService = new EmailService();
