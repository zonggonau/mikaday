import "server-only";
import { env } from "./env";

// Printful API v1 — https://developers.printful.com/docs/
const BASE_URL = "https://api.printful.com";
const MAX_RETRIES = 3;

export class PrintfulError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PrintfulError";
  }
}

// ---------- Types (only the fields this app uses) ----------

export interface PfSyncProduct {
  id: number;
  external_id: string;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url: string | null;
  is_ignored: boolean;
}

export interface PfFile {
  type: string;
  preview_url: string | null;
  thumbnail_url: string | null;
  visible: boolean;
}

export interface PfSyncVariant {
  id: number;
  external_id: string;
  sync_product_id: number;
  name: string;
  synced: boolean;
  variant_id: number;
  main_category_id: number | null;
  retail_price: string;
  currency: string;
  sku: string | null;
  is_ignored: boolean;
  size: string | null;
  color: string | null;
  availability_status: string;
  product: { variant_id: number; product_id: number; image: string; name: string };
  files: PfFile[];
}

export interface PfCatalogProduct {
  product: {
    id: number;
    type: string;
    title: string;
    brand: string | null;
    description: string;
    main_category_id: number;
    image: string;
  };
  variants: {
    id: number;
    size: string | null;
    color: string | null;
    color_code: string | null;
    price: string;
    image: string;
  }[];
}

export interface PfCategory {
  id: number;
  parent_id: number;
  title: string;
}

export interface PfCountry {
  code: string;
  name: string;
  region: string;
  states: { code: string; name: string }[] | null;
}

export interface PfShippingRate {
  id: string;
  name: string;
  rate: string;
  currency: string;
  minDeliveryDays?: number;
  maxDeliveryDays?: number;
}

export interface PfRecipient {
  name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state_code?: string;
  state_name?: string;
  country_code: string;
  zip?: string;
  phone?: string;
  email?: string;
}

export interface PfShipment {
  id: number;
  carrier: string | null;
  service: string | null;
  tracking_number: string | number | null;
  tracking_url: string | null;
  created: number;
  ship_date: string | null;
  shipped_at: number | null;
  reshipment: boolean;
}

export interface PfOrder {
  id: number;
  external_id: string | null;
  status: string;
  shipping: string;
  shipping_service_name: string | null;
  created: number;
  updated: number;
  costs: Record<string, string | null>;
  shipments: PfShipment[];
}

export interface PfCreateOrder {
  external_id: string;
  shipping: string;
  recipient: PfRecipient;
  items: { sync_variant_id: number; quantity: number; retail_price?: string }[];
  retail_costs?: {
    currency: string;
    subtotal?: string;
    discount?: string;
    shipping?: string;
    tax?: string;
  };
}

export interface PfWebhookConfig {
  url: string | null;
  types: string[];
}

// ---------- HTTP ----------

type Envelope<T> = { code: number; result: T; paging?: { total: number; offset: number; limit: number } };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
  attempt = 0,
): Promise<Envelope<T>> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${env.printfulApiKey}`,
    "Content-Type": "application/json",
  };
  if (env.printfulStoreId) headers["X-PF-Store-Id"] = env.printfulStoreId;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  // Rate limit: 120 requests / 60s per store. Respect Retry-After with a little jitter.
  if (res.status === 429 && attempt < MAX_RETRIES) {
    const retryAfter = Number(res.headers.get("retry-after")) || 2 ** attempt * 5;
    await sleep(retryAfter * 1000 + Math.floor(Math.random() * 500));
    return request<T>(path, init, attempt + 1);
  }

  const json = (await res.json().catch(() => null)) as
    | (Envelope<T> & { error?: { message?: string } })
    | null;

  if (!res.ok || !json) {
    const message =
      json?.error?.message ||
      (typeof json?.result === "string" ? json.result : null) ||
      `Printful API error (${res.status})`;
    throw new PrintfulError(message, res.status);
  }
  return json;
}

// ---------- Endpoints ----------

export const printful = {
  /** All sync products in the store (paginated, 100 per page). */
  async listSyncProducts(): Promise<PfSyncProduct[]> {
    const all: PfSyncProduct[] = [];
    for (let offset = 0; ; offset += 100) {
      const page = await request<PfSyncProduct[]>(`/store/products?limit=100&offset=${offset}`);
      all.push(...page.result);
      const total = page.paging?.total ?? all.length;
      if (all.length >= total || page.result.length === 0) break;
    }
    return all;
  },

  async getSyncProduct(id: number | string) {
    const res = await request<{ sync_product: PfSyncProduct; sync_variants: PfSyncVariant[] }>(
      `/store/products/${id}`,
    );
    return res.result;
  },

  async getCatalogProduct(id: number) {
    return (await request<PfCatalogProduct>(`/products/${id}`)).result;
  },

  async getCategories() {
    return (await request<{ categories: PfCategory[] }>(`/categories`)).result.categories;
  },

  async getCountries() {
    return (await request<PfCountry[]>(`/countries`)).result;
  },

  async shippingRates(body: {
    recipient: Pick<PfRecipient, "address1" | "city" | "country_code" | "state_code" | "zip">;
    items: { variant_id: string; quantity: number; value?: string }[];
    currency?: string;
    locale?: string;
  }) {
    return (await request<PfShippingRate[]>(`/shipping/rates`, { method: "POST", body })).result;
  },

  async createOrder(body: PfCreateOrder, confirm: boolean) {
    return (await request<PfOrder>(`/orders?confirm=${confirm}`, { method: "POST", body })).result;
  },

  async getOrder(id: number | string) {
    return (await request<PfOrder>(`/orders/${id}`)).result;
  },

  async confirmOrder(id: number | string) {
    return (await request<PfOrder>(`/orders/${id}/confirm`, { method: "POST" })).result;
  },

  async cancelOrder(id: number | string) {
    return (await request<PfOrder>(`/orders/${id}`, { method: "DELETE" })).result;
  },

  async getWebhooks() {
    return (await request<PfWebhookConfig>(`/webhooks`)).result;
  },

  async setWebhooks(body: { url: string; types: string[] }) {
    return (await request<PfWebhookConfig>(`/webhooks`, { method: "POST", body })).result;
  },
};

/** Event types this app handles at /api/printful/webhook. */
export const PRINTFUL_WEBHOOK_TYPES = [
  "package_shipped",
  "package_returned",
  "order_created",
  "order_updated",
  "order_failed",
  "order_canceled",
  "order_put_hold",
  "order_remove_hold",
  "product_synced",
  "product_updated",
  "product_deleted",
];
