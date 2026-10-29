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
