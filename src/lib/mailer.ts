import "server-only";
import { createHash } from "node:crypto";
import nodemailer, { type Transporter } from "nodemailer";
import { db } from "./db";
import { env } from "./env";
import { open } from "./secret-box";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  replyTo?: string;
  /** Where the settings come from: Admin → Settings (database) or the SMTP_* env vars. */
  source: "admin" | "env";
}

const NOT_CONFIGURED = "Email belum dikonfigurasi. Isi pengaturan SMTP di Admin → Pengaturan.";

/** Settings saved in the admin panel win; the SMTP_* env vars are the fallback. */
export async function getMailConfig(): Promise<MailConfig | null> {
  const row = await db.mailSettings.findUnique({ where: { id: 1 } });
  if (row) {
    let pass = "";
    if (row.passEncrypted) {
      try {
        pass = open(row.passEncrypted);
      } catch {
        throw new Error("Password SMTP tidak bisa dibuka (AUTH_SECRET berubah?). Masukkan ulang di Admin → Pengaturan.");
      }
    }
    return {
      host: row.host,
      port: row.port,
      secure: row.secure,
      user: row.user,
      pass,
      from: row.from,
      replyTo: row.replyTo || env.emailReplyTo,
      source: "admin",
    };
  }
  if (env.emailConfigured) {
    return { ...env.smtp, from: env.emailFrom, replyTo: env.emailReplyTo, source: "env" };
  }
  return null;
}

/** Cheap check (no decryption) for deciding whether to queue an email at all. */
export async function isMailConfigured() {
  return env.emailConfigured || (await db.mailSettings.count({ where: { id: 1 } })) > 0;
}

let cached: { fingerprint: string; transporter: Transporter } | null = null;

function transport(config: MailConfig) {
  // Rebuild the transport whenever the settings change.
  const fingerprint = createHash("sha256")
    .update(JSON.stringify([config.host, config.port, config.secure, config.user, config.pass]))
    .digest("hex");
  if (cached?.fingerprint !== fingerprint) {
    cached = {
      fingerprint,
      transporter: nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.user ? { user: config.user, pass: config.pass } : undefined,
        // Fail fast so a slow mail server never holds up a webhook.
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
      }),
    };
  }
  return cached.transporter;
}

/** Sends one email through the configured SMTP server. Returns the provider's message ID. */
export async function sendMail(message: MailMessage) {
  const config = await getMailConfig();
  if (!config) throw new Error(NOT_CONFIGURED);
  const info = await transport(config).sendMail({ from: config.from, replyTo: config.replyTo, ...message });
  return info.messageId as string;
}

/** Turns common SMTP failures into advice an admin can act on. */
export function explainMailError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const code = (error as { code?: string } | null)?.code ?? "";
  if (code === "EAUTH" || /\b535\b|Username and Password not accepted|Invalid login|authentication failed/i.test(message)) {
    return "Login SMTP ditolak. Untuk Gmail: aktifkan 2-Step Verification lalu pakai App Password 16 karakter (bukan password Gmail biasa).";
  }
  if (["ETIMEDOUT", "ECONNREFUSED", "ENOTFOUND", "ESOCKET", "ECONNECTION"].includes(code) || /timeout|ENOTFOUND|ECONNREFUSED/i.test(message)) {
    return `Tidak bisa terhubung ke server SMTP (${message}). Periksa host dan port: 465 = SSL/TLS, 587 = STARTTLS.`;
  }
  if (/wrong version number|ssl3_get_record|certificate/i.test(message)) {
    return "Jenis keamanan tidak cocok dengan port. Pakai SSL/TLS untuk port 465 dan STARTTLS untuk port 587.";
  }
  return message;
}

/** Checks the SMTP login without sending anything (Admin → Settings). */
export async function verifyMailer() {
  const config = await getMailConfig();
  if (!config) throw new Error(NOT_CONFIGURED);
  await transport(config).verify();
  return config;
}
