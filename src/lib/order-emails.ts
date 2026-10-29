import "server-only";
import { after } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import type { ShippingAddress } from "./address";
import { db } from "./db";
import {
  orderConfirmedEmail,
  orderDeliveredEmail,
  orderShippedEmail,
  type EmailOrder,
  type RenderedEmail,
} from "./email-templates";
import { env } from "./env";
import { sendMail } from "./mailer";

export type OrderEmailKind = "order_confirmed" | "shipped" | "delivered";

export const ORDER_EMAIL_LABELS: Record<OrderEmailKind, string> = {
  order_confirmed: "Konfirmasi pesanan",
  shipped: "Paket dikirim",
  delivered: "Paket sampai",
};

const MAX_ATTEMPTS = 5;

function keyFor(kind: OrderEmailKind, orderId: string, shipmentId?: bigint | null) {
  if (kind === "order_confirmed") return `${kind}:${orderId}`;
  if (shipmentId == null) throw new Error(`A ${kind} email needs a shipment.`);
  return `${kind}:${shipmentId}`;
}

/** Renders the email from the current order data (also used for retries). */
async function render(kind: OrderEmailKind, orderId: string, shipmentId?: bigint | null) {
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, shipments: { orderBy: { createdAt: "asc" } } },
  });
  const data: EmailOrder = {
    invoiceNumber: order.invoiceNumber,
    customerName: order.customerName,
    currency: order.currency,
    subtotal: Number(order.subtotal),
    shippingTotal: Number(order.shippingTotal),
    total: Number(order.total),
    shippingMethodName: order.shippingMethodName,
    address: order.shippingAddress as unknown as ShippingAddress,
    items: order.items.map((i) => ({
      name: i.productName,
      variant: i.variantName,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      imageUrl: i.imageUrl,
    })),
  };

  let email: RenderedEmail;
  if (kind === "order_confirmed") {
    email = orderConfirmedEmail(data);
  } else {
    const shipment = order.shipments.find((s) => s.id === shipmentId);
    if (!shipment) throw new Error(`Shipment ${shipmentId} not found on order ${order.invoiceNumber}.`);
    email =
      kind === "shipped"
        ? orderShippedEmail(data, shipment, order.shipments.length)
        : orderDeliveredEmail(data, shipment, order.shipments.length);
  }
  return { to: order.email, ...email };
}

async function deliver(id: string, message: Awaited<ReturnType<typeof render>>) {
  try {
    const messageId = await sendMail(message);
    return await db.orderEmail.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date(), messageId, error: null },
    });
  } catch (error) {
    console.error(`[email] sending ${id} failed`, error);
    return db.orderEmail.update({
      where: { id },
      data: { status: "FAILED", error: (error instanceof Error ? error.message : String(error)).slice(0, 500) },
    });
  }
}

/**
 * Sends a customer email once per event. Safe to call again for the same event (webhook retries,
 * admin refreshes): the unique key makes every call after the first a no-op.
 */
export async function sendOrderEmail(kind: OrderEmailKind, orderId: string, shipmentId?: bigint | null) {
  const message = await render(kind, orderId, shipmentId);
  let row;
  try {
    row = await db.orderEmail.create({
      data: {
        orderId,
        kind,
        key: keyFor(kind, orderId, shipmentId),
        shipmentId: shipmentId ?? null,
        to: message.to,
        subject: message.subject,
        status: env.emailConfigured ? "SENDING" : "SKIPPED",
        error: env.emailConfigured ? null : "Email belum dikonfigurasi (SMTP_HOST / EMAIL_FROM).",
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return null; // already handled
    throw error;
  }
  return row.status === "SENDING" ? deliver(row.id, message) : row;
}

/** Runs sendOrderEmail after the response, so buyers and webhooks never wait on the mail server. */
export function sendOrderEmailLater(kind: OrderEmailKind, orderId: string, shipmentId?: bigint | null) {
  const task = () =>
    sendOrderEmail(kind, orderId, shipmentId).catch((error) => console.error(`[email] ${kind} for ${orderId}`, error));
  try {
    after(task);
  } catch {
    void task(); // outside a request (scripts)
  }
}

/** Admin: send (again) now, whatever happened before. Throws when sending fails. */
export async function resendOrderEmail(kind: OrderEmailKind, orderId: string, shipmentId?: bigint | null) {
  if (!env.emailConfigured) throw new Error("Email belum dikonfigurasi (SMTP_HOST / EMAIL_FROM).");
  const message = await render(kind, orderId, shipmentId);
  const key = keyFor(kind, orderId, shipmentId);
  const row = await db.orderEmail.upsert({
    where: { key },
    create: { orderId, kind, key, shipmentId: shipmentId ?? null, to: message.to, subject: message.subject, status: "SENDING" },
    update: { to: message.to, subject: message.subject, status: "SENDING", error: null, attempts: { increment: 1 } },
  });
  const result = await deliver(row.id, message);
  if (result.status !== "SENT") throw new Error(result.error ?? "Email tidak terkirim.");
  return result;
}

/** Cron: retry failed sends (and ones interrupted mid-send) a few times. */
export async function retryFailedEmails() {
  if (!env.emailConfigured) return { retried: 0, sent: 0 };
  const now = Date.now();
  const rows = await db.orderEmail.findMany({
    where: {
      attempts: { lt: MAX_ATTEMPTS },
      OR: [
        { status: "FAILED", updatedAt: { lt: new Date(now - 15 * 60_000) } },
        { status: "SENDING", updatedAt: { lt: new Date(now - 30 * 60_000) } },
      ],
    },
    orderBy: { updatedAt: "asc" },
    take: 20,
  });
  let sent = 0;
  for (const row of rows) {
    await db.orderEmail.update({ where: { id: row.id }, data: { status: "SENDING", attempts: { increment: 1 } } });
    try {
      const result = await deliver(row.id, await render(row.kind as OrderEmailKind, row.orderId, row.shipmentId));
      if (result.status === "SENT") sent++;
    } catch (error) {
      await db.orderEmail.update({
        where: { id: row.id },
        data: { status: "FAILED", error: (error instanceof Error ? error.message : String(error)).slice(0, 500) },
      });
    }
  }
  return { retried: rows.length, sent };
}
