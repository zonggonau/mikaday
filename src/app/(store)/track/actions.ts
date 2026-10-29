"use server";

import { headers } from "next/headers";
import type { OrderStatus } from "@/generated/prisma/enums";
import { findOrderForCustomer } from "@/lib/orders";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export interface TrackedOrder {
  invoiceNumber: string;
  placedAt: string;
  status: OrderStatus;
  currency: string;
  total: number;
  shippingMethod: string | null;
  items: { name: string; variant: string | null; quantity: number; price: number; imageUrl: string | null }[];
  shipments: {
    carrier: string | null;
    service: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    shippedAt: string | null;
  }[];
}

export type TrackState = { error?: string; order?: TrackedOrder };

export async function trackOrder(_previous: TrackState, formData: FormData): Promise<TrackState> {
  if (!rateLimit(`track:${clientIp(await headers())}`, 10, 60_000)) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  const invoice = String(formData.get("invoice") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!invoice || !email) return { error: "Enter your order number and email address." };

  const order = await findOrderForCustomer(invoice, email);
  if (!order) {
    return { error: "We couldn't find an order with that number and email. Please check both and try again." };
  }

  return {
    order: {
      invoiceNumber: order.invoiceNumber,
      placedAt: order.createdAt.toISOString(),
      status: order.status,
      currency: order.currency,
      total: Number(order.total),
      shippingMethod: order.shippingMethodName,
      items: order.items.map((i) => ({
        name: i.productName,
        variant: i.variantName,
        quantity: i.quantity,
        price: Number(i.unitPrice),
        imageUrl: i.imageUrl,
      })),
      shipments: order.shipments.map((s) => ({
        carrier: s.carrier,
        service: s.service,
        trackingNumber: s.trackingNumber,
        trackingUrl: s.trackingUrl,
        shippedAt: s.shippedAt?.toISOString() ?? null,
      })),
    },
  };
}
