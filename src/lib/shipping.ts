import "server-only";
import { cacheLife } from "next/cache";
import { db } from "./db";
import { printful, PrintfulError } from "./printful";

export interface ShippingAddress {
  countryCode: string;
  stateCode?: string | null;
  city?: string | null;
  zip?: string | null;
  address1?: string | null;
}

export interface ShippingItem {
  variantId: string; // Printful sync variant ID
  quantity: number;
}

export interface ShippingQuote {
  id: string; // Printful shipping method, e.g. STANDARD — also sent back when creating the order
  name: string;
  rate: number;
  currency: string;
  minDeliveryDays: number | null;
  maxDeliveryDays: number | null;
}

export class ShippingError extends Error {
  constructor(
    message: string,
    readonly key: string,
  ) {
    super(message);
  }
}

export interface Country {
  code: string;
  name: string;
  states: { code: string; name: string }[];
}

/** Countries Printful ships to, with the states it requires (US, CA, AU, …). */
export async function getCountries(): Promise<Country[]> {
  "use cache";
  cacheLife("days");

  const countries = await printful.getCountries();
  return countries
    .map((c) => ({ code: c.code, name: c.name, states: c.states ?? [] }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Real-time rates from Printful for the given cart and destination. */
export async function quoteShipping(
  address: ShippingAddress,
  items: ShippingItem[],
  currency?: string,
): Promise<ShippingQuote[]> {
  const countryCode = address.countryCode?.trim().toUpperCase();
  if (!countryCode) throw new ShippingError("Please choose a country.", "missing_country");

  const wanted = items.filter((i) => /^\d+$/.test(i.variantId) && i.quantity > 0);
  if (wanted.length === 0) throw new ShippingError("Your cart is empty.", "empty_cart");

  const variants = await db.variant.findMany({
    where: {
      id: { in: wanted.map((i) => BigInt(i.variantId)) },
      product: { published: true, deletedAt: null },
    },
    select: { id: true, catalogVariantId: true, retailPrice: true },
  });
  const byId = new Map(variants.map((v) => [v.id.toString(), v]));

  const lines = wanted.flatMap((item) => {
    const variant = byId.get(item.variantId);
    if (!variant) return [];
    return [
      {
        variant_id: String(variant.catalogVariantId),
        quantity: Math.min(Math.floor(item.quantity), 100),
        value: variant.retailPrice.toFixed(2),
      },
    ];
  });
  if (lines.length === 0) {
    throw new ShippingError("These products are no longer available.", "unavailable_items");
  }

  try {
    const rates = await printful.shippingRates({
      recipient: {
        country_code: countryCode,
        state_code: address.stateCode?.trim().toUpperCase() || undefined,
        city: address.city?.trim() || "",
        zip: address.zip?.trim() || undefined,
        address1: address.address1?.trim() || "",
      },
      items: lines,
      currency,
      locale: "en_US",
    });
    return rates.map((r) => ({
      id: r.id,
      name: r.name.trim(),
      rate: Number(r.rate),
      currency: r.currency,
      minDeliveryDays: r.minDeliveryDays ?? null,
      maxDeliveryDays: r.maxDeliveryDays ?? null,
    }));
  } catch (error) {
    if (error instanceof PrintfulError && error.status === 400) {
      throw new ShippingError(error.message, "invalid_address");
    }
    throw error;
  }
}
