import "server-only";
import { env } from "./env";

// PayPal REST API — Orders v2, Payments v2, Webhooks v1.

export class PayPalError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly issue: string | null,
    readonly debugId: string | null,
  ) {
    super(message);
    this.name = "PayPalError";
  }
}

const baseUrl = () =>
  env.paypalMode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

let token: { value: string; expiresAt: number } | null = null;

async function accessToken() {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;
  const credentials = Buffer.from(`${env.paypalClientId}:${env.paypalClientSecret}`).toString("base64");
  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const json = (await res.json().catch(() => null)) as { access_token?: string; expires_in?: number; error_description?: string } | null;
  if (!res.ok || !json?.access_token) {
    throw new PayPalError(json?.error_description ?? `PayPal authentication failed (${res.status})`, res.status, null, null);
  }
  token = { value: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 300) * 1000 };
  return token.value;
}

async function request<T>(path: string, init: { method?: string; body?: unknown; requestId?: string } = {}): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${await accessToken()}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  // Makes create/capture/refund safe to retry: PayPal replays the original response.
  if (init.requestId) headers["PayPal-Request-Id"] = init.requestId;

  const res = await fetch(`${baseUrl()}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (res.status === 204) return undefined as T;

  const json = (await res.json().catch(() => null)) as
    | (T & { message?: string; debug_id?: string; details?: { issue?: string; description?: string }[] })
    | null;
  if (!res.ok) {
    const detail = json?.details?.[0];
    throw new PayPalError(
      detail?.description ?? json?.message ?? `PayPal API error (${res.status})`,
      res.status,
      detail?.issue ?? null,
      json?.debug_id ?? null,
    );
  }
  return json as T;
}

// ---------- Types (only fields this app uses) ----------

export interface PayPalMoney {
  currency_code: string;
  value: string;
}

export interface PayPalCapture {
  id: string;
  status: "COMPLETED" | "DECLINED" | "PARTIALLY_REFUNDED" | "PENDING" | "REFUNDED" | "FAILED";
  amount: PayPalMoney;
  custom_id?: string;
  invoice_id?: string;
}

export interface PayPalOrder {
  id: string;
  status: string;
  payer?: { email_address?: string };
  purchase_units?: {
    custom_id?: string;
    invoice_id?: string;
    payments?: { captures?: PayPalCapture[] };
  }[];
}

export interface CreateOrderInput {
  orderId: string;
  invoiceNumber: string;
  currency: string;
  items: { name: string; sku: string; quantity: number; unitAmount: string; description?: string }[];
  itemTotal: string;
  shipping: string;
  total: string;
  shipTo: {
    name: string;
    address1: string;
    address2?: string | null;
    city: string;
    state?: string | null;
    zip?: string | null;
    countryCode: string;
  };
  brandName: string;
}

// ---------- Endpoints ----------

export const paypal = {
  async createOrder(input: CreateOrderInput) {
    const money = (value: string) => ({ currency_code: input.currency, value });
    return request<PayPalOrder>("/v2/checkout/orders", {
      method: "POST",
      requestId: `create-${input.orderId}`,
      body: {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: input.orderId,
            custom_id: input.orderId,
            invoice_id: input.invoiceNumber,
            amount: {
              ...money(input.total),
              breakdown: { item_total: money(input.itemTotal), shipping: money(input.shipping) },
            },
            items: input.items.map((item) => ({
              name: item.name.slice(0, 127),
              sku: item.sku,
              description: item.description?.slice(0, 127),
              quantity: String(item.quantity),
              unit_amount: money(item.unitAmount),
              category: "PHYSICAL_GOODS",
            })),
            shipping: {
              type: "SHIPPING",
              name: { full_name: input.shipTo.name.slice(0, 300) },
              address: {
                address_line_1: input.shipTo.address1,
                address_line_2: input.shipTo.address2 || undefined,
                admin_area_2: input.shipTo.city,
                admin_area_1: input.shipTo.state || undefined,
                postal_code: input.shipTo.zip || undefined,
                country_code: input.shipTo.countryCode,
              },
            },
          },
        ],
        // The buyer cannot change the address in PayPal, so the shipping rate we quoted stays valid.
        application_context: {
          brand_name: input.brandName.slice(0, 127),
          shipping_preference: "SET_PROVIDED_ADDRESS",
          user_action: "PAY_NOW",
        },
      },
    });
  },

  async getOrder(paypalOrderId: string) {
    return request<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`);
  },

  async captureOrder(paypalOrderId: string, requestId: string) {
    return request<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
      method: "POST",
      requestId,
      body: {},
    });
  },

  async refundCapture(captureId: string, requestId: string) {
    return request<{ id: string; status: string }>(`/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {
      method: "POST",
      requestId,
      body: {},
    });
  },

  /** Adds tracking to the PayPal order; PayPal emails the buyer and it helps release payment holds. */
  async addTracking(paypalOrderId: string, input: { captureId: string; trackingNumber: string; carrier: string | null }) {
    return request<unknown>(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/track`, {
      method: "POST",
      body: {
        capture_id: input.captureId,
        tracking_number: input.trackingNumber.slice(0, 64),
        ...paypalCarrier(input.carrier),
        notify_payer: true,
      },
    });
  },

  async verifyWebhook(headers: Headers, event: unknown) {
    const webhookId = env.paypalWebhookId;
    if (!webhookId) return false;
    const result = await request<{ verification_status: string }>("/v1/notifications/verify-webhook-signature", {
      method: "POST",
      body: {
        auth_algo: headers.get("paypal-auth-algo"),
        cert_url: headers.get("paypal-cert-url"),
        transmission_id: headers.get("paypal-transmission-id"),
        transmission_sig: headers.get("paypal-transmission-sig"),
        transmission_time: headers.get("paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: event,
      },
    });
    return result.verification_status === "SUCCESS";
  },

  /** Cheap credential check for the admin settings page. */
  async ping() {
    await accessToken();
  },
};

// PayPal accepts a fixed carrier enum; anything else is sent as OTHER with its name.
const PAYPAL_CARRIERS = new Set([
  "USPS", "UPS", "FEDEX", "DHL", "DPD", "GLS", "ROYAL_MAIL", "ASENDIA", "ASENDIA_US", "ASENDIA_UK",
  "GLOBEGISTICS", "SPRING_GDS", "HERMES", "DHL_GLOBAL_MAIL", "POSTNL_INTERNATIONAL", "APC_OVERNIGHT",
]);

function paypalCarrier(carrier: string | null) {
  const normalized = (carrier ?? "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
  if (PAYPAL_CARRIERS.has(normalized)) return { carrier: normalized };
  if (normalized.startsWith("DHL")) return { carrier: "DHL" };
  return { carrier: "OTHER", carrier_name_other: (carrier || "Other").slice(0, 64) };
}

export const PAYPAL_WEBHOOK_EVENTS = [
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.CAPTURE.DENIED",
  "PAYMENT.CAPTURE.REFUNDED",
  "PAYMENT.CAPTURE.REVERSED",
];
