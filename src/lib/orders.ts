import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/generated/prisma/enums";
import type { ShippingAddress } from "./address";
import { db } from "./db";
import { env } from "./env";
import { paypal } from "./paypal";
import { printfulRegion } from "./regions";
import {
  printful,
  PrintfulError,
  type PfCreateOrder,
  type PfOrder,
  type PfRecipient,
  type PfShipment,
} from "./printful";

const PRINTFUL_STATUS: Record<string, OrderStatus> = {
  draft: "DRAFT",
  pending: "PROCESSING",
  inreview: "PROCESSING",
  inprocess: "PROCESSING",
  onhold: "ON_HOLD",
  partial: "PARTIAL",
  fulfilled: "SHIPPED",
  canceled: "CANCELED",
  failed: "FAILED",
};

/** Orders that may still change in Printful (worth refreshing / cancelling). */
export const OPEN_STATUSES: OrderStatus[] = ["RECEIVED", "DRAFT", "PROCESSING", "ON_HOLD", "PARTIAL"];

// ---------- Database → Printful ----------

function recipientFor(order: { customerName: string; email: string; phone: string | null; shippingAddress: unknown }) {
  const a = (order.shippingAddress ?? {}) as Partial<ShippingAddress>;
  const state = a.state?.trim();
  const recipient: PfRecipient = {
    name: a.name || order.customerName || order.email,
    company: a.company || undefined,
    address1: a.address1 ?? "",
    address2: a.address2 || undefined,
    city: a.city ?? "",
    country_code: (a.country ?? "").toUpperCase(),
    zip: a.zip || undefined,
    phone: a.phone || order.phone || undefined,
    email: order.email,
  };
  return { ...recipient, ...printfulRegion(recipient.country_code, state) };
}

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

export function printfulOrderPayload(order: OrderWithItems): PfCreateOrder {
  return {
    // Our order ID (a cuid) fits Printful's 32-character external_id and links webhooks back to us.
    external_id: order.id,
    shipping: order.shippingMethod || "STANDARD",
    recipient: recipientFor(order),
    items: order.items.map((i) => ({
      sync_variant_id: Number(i.variantId),
      quantity: i.quantity,
      retail_price: i.unitPrice.toFixed(2),
    })),
    retail_costs: {
      currency: order.currency,
      subtotal: order.subtotal.toFixed(2),
      discount: order.discountTotal.toFixed(2),
      shipping: order.shippingTotal.toFixed(2),
      tax: order.taxTotal.toFixed(2),
    },
  };
}

/** Creates the Printful order (draft unless PRINTFUL_AUTO_CONFIRM=true). Idempotent via external_id. */
export async function submitOrderToPrintful(orderId: string) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  if (order.printfulOrderId) return order;
  if (!order.paidAt || order.paymentStatus !== "COMPLETED") {
    throw new Error("Payment has not been completed; the order cannot be sent to Printful yet.");
  }
  if (order.items.length === 0) throw new Error("Order has no items that can be fulfilled.");

  const payload = printfulOrderPayload(order);
  try {
    // Sandbox payments are not real money, so their Printful orders always stay as (free) drafts.
    const created = await printful.createOrder(payload, env.printfulAutoConfirm && order.mode === "live");
    return await applyPrintfulOrder(created, order.id);
  } catch (error) {
    // The order may already exist in Printful (e.g. a retry after a timeout).
    if (error instanceof PrintfulError && error.status === 400) {
      const existing = await printful.getOrder(`@${payload.external_id}`).catch(() => null);
      if (existing) return applyPrintfulOrder(existing, order.id);
    }
    const message = error instanceof Error ? error.message : String(error);
    await db.order.update({ where: { id: order.id }, data: { status: "FAILED", lastError: message } });
    throw error;
  }
}

async function findOrderForPrintful(pf: Pick<PfOrder, "id" | "external_id">) {
  return db.order.findFirst({
    where: {
      OR: [{ printfulOrderId: BigInt(pf.id) }, ...(pf.external_id ? [{ id: pf.external_id }] : [])],
    },
  });
}

async function upsertShipment(orderId: string, s: PfShipment) {
  const data = {
    orderId,
    carrier: s.carrier,
    service: s.service,
    trackingNumber: s.tracking_number ? String(s.tracking_number) : null,
    trackingUrl: s.tracking_url || null,
    shippedAt: s.shipped_at ? new Date(s.shipped_at * 1000) : s.ship_date ? new Date(s.ship_date) : null,
  };
  await db.shipment.upsert({
    where: { id: BigInt(s.id) },
    create: { id: BigInt(s.id), ...data },
    update: data,
  });
}

/** Copies Printful's view of an order (status, costs, shipments) onto our record. */
export async function applyPrintfulOrder(
  pf: PfOrder,
  knownOrderId?: string,
  overrides: { status?: OrderStatus; lastError?: string | null } = {},
) {
  const order = knownOrderId
    ? await db.order.findUnique({ where: { id: knownOrderId } })
    : await findOrderForPrintful(pf);
  if (!order) return null;

  // Tracking numbers we have not seen before, however they arrive (webhook, admin refresh, customer lookup).
  const known = new Map(
    (await db.shipment.findMany({ where: { orderId: order.id }, select: { id: true, trackingNumber: true } })).map((s) => [
      s.id.toString(),
      s.trackingNumber,
    ]),
  );
  const newlyTracked: PfShipment[] = [];
  for (const shipment of pf.shipments ?? []) {
    const trackingNumber = shipment.tracking_number ? String(shipment.tracking_number) : null;
    if (trackingNumber && known.get(String(shipment.id)) !== trackingNumber) newlyTracked.push(shipment);
    await upsertShipment(order.id, shipment);
  }

  // A refund decided on our side outranks Printful's view of the order.
  const status =
    order.status === "REFUNDED" ? "REFUNDED" : (overrides.status ?? PRINTFUL_STATUS[pf.status] ?? order.status);
  const updated = await db.order.update({
    where: { id: order.id },
    data: {
      printfulOrderId: BigInt(pf.id),
      printfulStatus: pf.status,
      printfulCosts: (pf.costs ?? undefined) as Prisma.InputJsonValue | undefined,
      status,
      lastError: overrides.lastError !== undefined ? overrides.lastError : status === "FAILED" ? order.lastError : null,
    },
  });

  for (const shipment of newlyTracked) await sendTrackingToPayPal(updated, shipment);
  return updated;
}

/** PayPal emails the buyer the tracking number, and tracking helps release payment holds. */
async function sendTrackingToPayPal(
  order: { invoiceNumber: string; paymentOrderId: string | null; paymentCaptureId: string | null },
  shipment: PfShipment,
) {
  if (!order.paymentOrderId || !order.paymentCaptureId || !shipment.tracking_number) return;
  try {
    await paypal.addTracking(order.paymentOrderId, {
      captureId: order.paymentCaptureId,
      trackingNumber: String(shipment.tracking_number),
      carrier: shipment.carrier,
    });
  } catch (error) {
    console.error(`[orders] could not add PayPal tracking for ${order.invoiceNumber}`, error);
  }
}

/** package_shipped: the event's shipment may not be listed on the order yet, so merge it in. */
export async function handlePackageShipped(pf: PfOrder, shipment: PfShipment) {
  const shipments = [...(pf.shipments ?? []).filter((s) => s.id !== shipment.id), shipment];
  return applyPrintfulOrder({ ...pf, shipments }, undefined, {
    status: pf.status === "partial" ? "PARTIAL" : "SHIPPED",
  });
}

// ---------- Admin actions ----------

async function requirePrintfulId(orderId: string) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (!order.printfulOrderId) throw new Error("This order has not been sent to Printful yet.");
  return order.printfulOrderId.toString();
}

export async function confirmPrintfulOrder(orderId: string) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.mode !== "live") {
    throw new Error(
      "Order uji (PayPal sandbox) tidak bisa dikonfirmasi: pembayarannya tidak nyata, tetapi Printful akan menagih uang sungguhan.",
    );
  }
  return applyPrintfulOrder(await printful.confirmOrder(await requirePrintfulId(orderId)), orderId);
}

export async function cancelPrintfulOrder(orderId: string) {
  return applyPrintfulOrder(await printful.cancelOrder(await requirePrintfulId(orderId)), orderId, {
    status: "CANCELED",
  });
}

export async function refreshPrintfulOrder(orderId: string) {
  return applyPrintfulOrder(await printful.getOrder(await requirePrintfulId(orderId)), orderId);
}

// ---------- Customer order tracking ----------

export async function findOrderForCustomer(invoiceNumber: string, email: string) {
  let order = await db.order.findFirst({
    where: {
      invoiceNumber: { equals: invoiceNumber.trim(), mode: "insensitive" },
      email: { equals: email.trim(), mode: "insensitive" },
      status: { not: "PENDING_PAYMENT" },
    },
  });
  if (!order) return null;

  // Webhooks keep orders current; refresh stale open orders as a fallback.
  const stale = Date.now() - order.updatedAt.getTime() > 10 * 60 * 1000;
  if (order.printfulOrderId && stale && OPEN_STATUSES.includes(order.status)) {
    order = (await refreshPrintfulOrder(order.id).catch(() => null)) ?? order;
  }

  return db.order.findUniqueOrThrow({
    where: { id: order.id },
    include: { items: true, shipments: { orderBy: { createdAt: "asc" } } },
  });
}
