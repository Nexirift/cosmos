import * as nodemailer from "nodemailer";
import * as fs from "node:fs";
import * as path from "node:path";
import { env } from "@/env";
import { checkCache } from "./actions";
import { SettingKey } from "./defaults";

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

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      from: env.SMTP_FROM,
      port: env.SMTP_PORT,
      auth: {
        user: env.SMTP_AUTH_USER,
        pass: env.SMTP_AUTH_PASS,
      },
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

    const defaultVariables = {
      app_name: await checkCache(SettingKey.appName),
      app_logo: await checkCache(SettingKey.appLogo),
      home_url: env.BETTER_AUTH_URL,
      support_email: env.SUPPORT_EMAIL,
    };

    const variables = { ...defaultVariables, ...dynamicVariables };

    try {
      const template = fs.readFileSync(templatePath, "utf-8");
      return Object.entries(variables).reduce(
        (result, [key, value]) =>
          result.replaceAll(`{{ $${key} }}`, value?.toString() ?? ""),
        template,
      );
    } catch (error) {
      console.error(`Failed to parse email template: ${templatePath}`, error);
      throw new Error(
        `Email template not found or inaccessible: ${templateName}`,
      );
    }
  }

  /**
   * Send an email with HTML template
   */
  public async sendMail(
    to: string,
    subject: string,
    template: EmailTemplate | string,
    variables: Record<string, unknown> = {},
    text?: string,
  ): Promise<nodemailer.SentMessageInfo> {
    const html = await this.parseDynamicTemplate(variables, template);

    const fallbackText = text
      ? `${text}\n\nNote: This version of the email only shows up if your email client couldn't render the HTML content.`
      : "Please use an HTML-capable email client to view this message.";

    const mailOptions = {
      to,
      subject,
      text: fallbackText,
      html,
    };

    return this.transporter.sendMail(mailOptions);
  }
}

export const emailService = new EmailService();
