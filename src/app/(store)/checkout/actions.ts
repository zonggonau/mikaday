"use server";

import { headers } from "next/headers";
import { z } from "zod";
import {
  cartItemsSchema,
  CheckoutError,
  completeCheckout,
  customerSchema,
  quoteCheckout,
  startCheckout,
} from "@/lib/checkout";
import { env } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { ShippingError } from "@/lib/shipping";

export type CheckoutQuote = Awaited<ReturnType<typeof quoteCheckout>>;
type Failure = { ok: false; error: string; restart?: boolean };

const FIELD_LABELS: Record<string, string> = {
  email: "email address",
  name: "full name",
  phone: "phone number",
  address1: "street address",
  address2: "apartment / suite",
  city: "city",
  state: "state / province",
  zip: "ZIP / postal code",
  country: "country",
};

function failure(error: unknown): Failure {
  if (error instanceof CheckoutError) return { ok: false, error: error.message, restart: error.restart };
  if (error instanceof ShippingError) return { ok: false, error: error.message };
  if (error instanceof z.ZodError) {
    const field = String(error.issues[0]?.path[0] ?? "");
    return { ok: false, error: FIELD_LABELS[field] ? `Please check your ${FIELD_LABELS[field]}.` : "Please review your cart." };
  }
  console.error("[checkout]", error);
  return { ok: false, error: "Something went wrong on our side. Please try again in a moment." };
}

async function allowed(action: string, limit: number) {
  return rateLimit(`${action}:${clientIp(await headers())}`, limit, 60_000);
}

const tooMany: Failure = { ok: false, error: "Too many attempts. Please wait a minute and try again." };

export async function getCheckoutQuote(items: unknown, customer: unknown): Promise<{ ok: true; quote: CheckoutQuote } | Failure> {
  if (!(await allowed("quote", 20))) return tooMany;
  try {
    return { ok: true, quote: await quoteCheckout(cartItemsSchema.parse(items), customerSchema.parse(customer)) };
  } catch (error) {
    return failure(error);
  }
}

export async function createPayPalOrder(items: unknown, customer: unknown, rateId: string): Promise<{ ok: true; paypalOrderId: string } | Failure> {
  if (!env.paypalConfigured) return { ok: false, error: "Online payment is not available yet." };
  if (!(await allowed("paypal-create", 10))) return tooMany;
  try {
    const paypalOrderId = await startCheckout(
      cartItemsSchema.parse(items),
      customerSchema.parse(customer),
      z.string().min(1).max(64).parse(rateId),
    );
    return { ok: true, paypalOrderId };
  } catch (error) {
    return failure(error);
  }
}

export async function capturePayPalOrder(
  paypalOrderId: string,
): Promise<{ ok: true; invoiceNumber: string; total: number; currency: string } | Failure> {
  if (!(await allowed("paypal-capture", 10))) return tooMany;
  try {
    const order = await completeCheckout(z.string().min(1).max(64).parse(paypalOrderId));
    return { ok: true, invoiceNumber: order.invoiceNumber, total: Number(order.total), currency: order.currency };
  } catch (error) {
    return failure(error);
  }
}
