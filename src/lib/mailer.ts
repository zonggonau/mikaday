import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let transporter: Transporter | null = null;

function transport() {
  if (!transporter) {
    const { host, port, secure, user, pass } = env.smtp;
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
      // Fail fast so a slow mail server never holds up a webhook.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
  return transporter;
}

/** Sends one email through the configured SMTP server. Returns the provider's message ID. */
export async function sendMail(message: MailMessage) {
  if (!env.emailConfigured) throw new Error("Email is not configured (SMTP_HOST / EMAIL_FROM).");
  const info = await transport().sendMail({
    from: env.emailFrom,
    replyTo: env.emailReplyTo,
    ...message,
  });
  return info.messageId as string;
}

/** Checks the SMTP login without sending anything (Admin → Settings). */
export async function verifyMailer() {
  if (!env.emailConfigured) throw new Error("Email is not configured (SMTP_HOST / EMAIL_FROM).");
  await transport().verify();
}
