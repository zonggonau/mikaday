import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/** Server-only configuration. Values are read lazily so a missing optional key never breaks the build. */
export const env = {
  get printfulApiKey() {
    return required("PRINTFUL_API_KEY");
  },
  /** Only needed for account-level Printful tokens; store-level tokens are already bound to one store. */
  get printfulStoreId() {
    return process.env.PRINTFUL_STORE_ID || undefined;
  },
  /** When true, Printful orders are submitted for fulfillment immediately instead of being created as drafts. */
  get printfulAutoConfirm() {
    return process.env.PRINTFUL_AUTO_CONFIRM === "true";
  },
  get webhookSecret() {
    return required("SYNC_WEBHOOK_SECRET");
  },
  get paypalClientId() {
    return required("NEXT_PUBLIC_PAYPAL_CLIENT_ID");
  },
  get paypalClientSecret() {
    return required("PAYPAL_CLIENT_SECRET");
  },
  /** "sandbox" (default) or "live". Must match the client ID / secret pair. */
  get paypalMode(): "sandbox" | "live" {
    return process.env.PAYPAL_MODE === "live" ? "live" : "sandbox";
  },
  /** Webhook ID from the PayPal developer dashboard; required to verify webhook signatures. */
  get paypalWebhookId() {
    return process.env.PAYPAL_WEBHOOK_ID || undefined;
  },
  get paypalConfigured() {
    return Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
  },
  /** SMTP server for customer emails (any provider: Brevo, Resend, Zoho, Hostinger Mail, …). */
  get smtp() {
    const port = Number(process.env.SMTP_PORT) || 587;
    return {
      host: process.env.SMTP_HOST || "",
      port,
      // Port 465 speaks TLS from the start; 587/25 upgrade with STARTTLS.
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    };
  },
  /** Sender, e.g. `MIKADAY <orders@mikaday.store>` — the domain must be verified with the SMTP provider. */
  get emailFrom() {
    return process.env.EMAIL_FROM || "";
  },
  /** Where customer replies go; defaults to the public support address. */
  get emailReplyTo() {
    return process.env.EMAIL_REPLY_TO || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || undefined;
  },
  get emailConfigured() {
    return Boolean(process.env.SMTP_HOST && process.env.EMAIL_FROM);
  },
  /** Bearer token for /api/cron/orders (delivery checks and email retries). */
  get cronSecret() {
    return process.env.CRON_SECRET || undefined;
  },
  get authSecret() {
    return required("AUTH_SECRET");
  },
  get adminEmail() {
    return required("ADMIN_EMAIL");
  },
  get adminPassword() {
    return required("ADMIN_PASSWORD");
  },
};
