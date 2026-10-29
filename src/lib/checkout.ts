import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import type { ShippingAddress } from "./address";
import { db } from "./db";
import { env } from "./env";
import { sendOrderEmailLater } from "./order-emails";
import { cancelPrintfulOrder, submitOrderToPrintful } from "./orders";
import { paypal, PayPalError, type PayPalCapture } from "./paypal";
import { paypalRegion } from "./regions";
import { getCountries, quoteShipping, regionsOf, type ShippingQuote } from "./shipping";
import { site } from "./site";

export class CheckoutError extends Error {
  constructor(
    message: string,
    /** True when the buyer should pick another payment method in the PayPal popup. */
    readonly restart = false,
  ) {
    super(message);
  }
}

export const cartItemsSchema = z
  .array(z.object({ variantId: z.string().regex(/^\d+$/), quantity: z.number().int().min(1).max(20) }))
  .min(1, "Your cart is empty.")
  .max(50);

export const customerSchema = z.object({
  email: z.email().max(254),
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).default(""),
  address1: z.string().trim().min(3).max(200),
  address2: z.string().trim().max(200).default(""),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().max(60).default(""),
  zip: z.string().trim().max(20).default(""),
  country: z.string().trim().length(2).toUpperCase(),
});

export type CartItemInput = z.infer<typeof cartItemsSchema>[number];
export type CustomerInput = z.infer<typeof customerSchema>;

/** Printful statuses in which an order can still be cancelled without production cost. */
const CANCELLABLE = new Set(["draft", "pending", "failed", "onhold"]);

const toCents = (value: number | string | Prisma.Decimal) => Math.round(Number(value) * 100);
const fromCents = (cents: number) => (cents / 100).toFixed(2);
const invoiceFor = (number: number) => `ORD-${1000 + number}`;

// ---------- Cart pricing (prices always come from the database, never from the browser) ----------

export interface PricedLine {
  variantId: string;
  productName: string;
  variantName: string | null;
  imageUrl: string | null;
  slug: string;
  unitPrice: number;
  quantity: number;
}

export async function priceCart(items: CartItemInput[]) {
  const quantities = new Map<string, number>();
  for (const item of items) {
    quantities.set(item.variantId, Math.min(20, (quantities.get(item.variantId) ?? 0) + item.quantity));
  }

  const variants = await db.variant.findMany({
    where: {
      id: { in: [...quantities.keys()].map((id) => BigInt(id)) },
      enabled: true,
      availability: "active",
      currency: site.currency,
      product: { published: true, deletedAt: null },
    },
    include: { product: { select: { name: true, title: true, slug: true } } },
  });
  const byId = new Map(variants.map((v) => [v.id.toString(), v]));

  const lines: PricedLine[] = [];
  const unavailable: string[] = [];
  for (const [variantId, quantity] of quantities) {
    const v = byId.get(variantId);
    if (!v) {
      unavailable.push(variantId);
      continue;
    }
    lines.push({
      variantId,
      productName: v.product.title || v.product.name,
      variantName: [v.color, v.size].filter(Boolean).join(" / ") || null,
      imageUrl: v.imageUrl,
      slug: v.product.slug,
      unitPrice: Number(v.retailPrice),
      quantity,
    });
  }

  const subtotalCents = lines.reduce((sum, l) => sum + toCents(l.unitPrice) * l.quantity, 0);
  return { lines, unavailable, subtotal: subtotalCents / 100, currency: site.currency };
}

function shippingAddressOf(customer: CustomerInput) {
  return {
    countryCode: customer.country,
    stateCode: customer.state || null,
    city: customer.city,
    zip: customer.zip || null,
    address1: customer.address1,
  };
}

/** Cart prices plus live Printful shipping options for the address. */
export async function quoteCheckout(items: CartItemInput[], customer: CustomerInput) {
  const cart = await priceCart(items);
  const rates: ShippingQuote[] = cart.lines.length
    ? await quoteShipping(
        shippingAddressOf(customer),
        cart.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        site.currency,
      )
    : [];
  return { ...cart, rates: rates.filter((r) => r.currency === site.currency) };
}

// ---------- PayPal order lifecycle ----------

/** Creates our order (PENDING_PAYMENT) and the matching PayPal order. Returns the PayPal order ID. */
export async function startCheckout(items: CartItemInput[], customer: CustomerInput, rateId: string) {
  const cart = await priceCart(items);
  if (cart.unavailable.length) {
    throw new CheckoutError("Some items in your cart are no longer available. Please review your cart.");
  }
  if (cart.lines.length === 0) throw new CheckoutError("Your cart is empty.");

  // PayPal shows only a generic error page when a required province is missing or unknown.
  const regions = regionsOf((await getCountries()).find((c) => c.code === customer.country));
  if (regions.length > 0 && !regions.some((r) => r.code === customer.state)) {
    throw new CheckoutError("Please choose a state / province.");
  }

  const rates = await quoteShipping(
    shippingAddressOf(customer),
    cart.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
    site.currency,
  );
  const rate = rates.find((r) => r.id === rateId && r.currency === site.currency);
  if (!rate) throw new CheckoutError("That shipping option is no longer available. Please recalculate shipping.");

  const itemTotal = cart.lines.reduce((sum, l) => sum + toCents(l.unitPrice) * l.quantity, 0);
  const shipping = toCents(rate.rate);
  const total = itemTotal + shipping;

  const address: ShippingAddress = {
    name: customer.name,
    address1: customer.address1,
    address2: customer.address2 || null,
    city: customer.city,
    state: customer.state || null,
    zip: customer.zip || null,
    country: customer.country,
    phone: customer.phone || null,
  };

  // Abandoned checkouts are only useful for a short while.
  void db.order
    .deleteMany({ where: { status: "PENDING_PAYMENT", paidAt: null, createdAt: { lt: new Date(Date.now() - 7 * 86_400_000) } } })
    .catch(() => {});

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        invoiceNumber: `TMP-${randomUUID()}`,
        mode: env.paypalMode,
        email: customer.email,
        phone: customer.phone || null,
        customerName: customer.name,
        currency: site.currency,
        subtotal: fromCents(itemTotal),
        shippingTotal: fromCents(shipping),
        taxTotal: 0,
        discountTotal: 0,
        total: fromCents(total),
        shippingMethod: rate.id,
        shippingMethodName: rate.name,
        shippingAddress: address as unknown as Prisma.InputJsonValue,
        status: "PENDING_PAYMENT",
        items: {
          create: cart.lines.map((l) => ({
            variantId: BigInt(l.variantId),
            productName: l.productName,
            variantName: l.variantName,
            imageUrl: l.imageUrl,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
        },
      },
    });
    return tx.order.update({ where: { id: created.id }, data: { invoiceNumber: invoiceFor(created.number) } });
  });

  try {
    const paypalOrder = await paypal.createOrder({
      orderId: order.id,
      invoiceNumber: order.invoiceNumber,
      currency: site.currency,
      items: cart.lines.map((l) => ({
        name: l.productName,
        sku: l.variantId,
        description: l.variantName ?? undefined,
        quantity: l.quantity,
        unitAmount: fromCents(toCents(l.unitPrice)),
      })),
      itemTotal: fromCents(itemTotal),
      shipping: fromCents(shipping),
      total: fromCents(total),
      shipTo: {
        name: customer.name,
        address1: customer.address1,
        address2: customer.address2,
        city: customer.city,
        state: paypalRegion(customer.country, customer.state),
        zip: customer.zip,
        countryCode: customer.country,
      },
      brandName: site.name,
    });
    await db.order.update({
      where: { id: order.id },
      data: { paymentOrderId: paypalOrder.id, paymentStatus: paypalOrder.status },
    });
    return paypalOrder.id;
  } catch (error) {
    await db.order.delete({ where: { id: order.id } }).catch(() => {});
    if (error instanceof PayPalError && error.status === 422) {
      // e.g. an address PayPal cannot accept for this country.
      throw new CheckoutError(`PayPal could not accept this order: ${error.message}`);
    }
    throw error;
  }
}

/** Records a capture on the order and, once the money is in, sends it to Printful. */
async function applyCapture(orderId: string, capture: PayPalCapture) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  const amountMatches =
    capture.amount.currency_code === order.currency && toCents(capture.amount.value) === toCents(order.total);

  if (capture.status === "COMPLETED" || capture.status === "PENDING") {
    const completed = capture.status === "COMPLETED";
    const updated = await db.order.update({
      where: { id: order.id },
      data: {
        status: order.status === "PENDING_PAYMENT" ? "RECEIVED" : order.status,
        paymentStatus: capture.status,
        paymentCaptureId: capture.id,
        paidAt: completed ? (order.paidAt ?? new Date()) : order.paidAt,
        lastError: amountMatches
          ? capture.status === "PENDING"
            ? "PayPal is reviewing this payment; the order is sent to Printful once it completes."
            : null
          : `Captured ${capture.amount.value} ${capture.amount.currency_code}, expected ${order.total.toFixed(2)} ${order.currency}. Check before fulfilling.`,
      },
    });
    if (completed && amountMatches) {
      sendOrderEmailLater("order_confirmed", order.id);
      if (!updated.printfulOrderId) {
        await submitOrderToPrintful(order.id).catch((error) =>
          console.error(`[checkout] Printful submission failed for ${order.invoiceNumber}`, error),
        );
      }
    }
    return updated;
  }

  await db.order.update({
    where: { id: order.id },
    data: { paymentStatus: capture.status, paymentCaptureId: capture.id },
  });
  return null;
}

/** Captures an approved PayPal order. Safe to call twice (double click, webhook race). */
export async function completeCheckout(paypalOrderId: string) {
  const order = await db.order.findUnique({ where: { paymentOrderId: paypalOrderId } });
  if (!order) throw new CheckoutError("We couldn't find this checkout. Please try again.");
  if (order.paymentCaptureId && order.status !== "PENDING_PAYMENT") return order;

  let result;
  try {
    result = await paypal.captureOrder(paypalOrderId, `capture-${order.id}`);
  } catch (error) {
    if (error instanceof PayPalError && error.issue === "INSTRUMENT_DECLINED") {
      throw new CheckoutError("Your payment method was declined. Please try another one.", true);
    }
    if (error instanceof PayPalError && error.issue === "ORDER_ALREADY_CAPTURED") {
      result = await paypal.getOrder(paypalOrderId);
    } else {
      throw error;
    }
  }

  const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture) throw new CheckoutError("PayPal did not confirm the payment. Please try again.");

  const updated = await applyCapture(order.id, capture);
  if (!updated) throw new CheckoutError("The payment was declined. Please try another payment method.", true);
  return updated;
}

// ---------- Webhooks & refunds ----------

interface CaptureEventResource extends Partial<PayPalCapture> {
  links?: { rel: string; href: string }[];
  supplementary_data?: { related_ids?: { order_id?: string; capture_id?: string } };
}

async function findOrderForResource(resource: CaptureEventResource) {
  const captureId =
    resource.supplementary_data?.related_ids?.capture_id ??
    resource.links?.find((l) => l.rel === "up")?.href.split("/").pop();
  const or: Prisma.OrderWhereInput[] = [];
  if (resource.custom_id) or.push({ id: resource.custom_id });
  if (resource.supplementary_data?.related_ids?.order_id) {
    or.push({ paymentOrderId: resource.supplementary_data.related_ids.order_id });
  }
  if (captureId) or.push({ paymentCaptureId: captureId });
  if (resource.id) or.push({ paymentCaptureId: resource.id });
  return or.length ? db.order.findFirst({ where: { OR: or } }) : null;
}

export async function handlePayPalEvent(eventType: string, resource: CaptureEventResource) {
  const order = await findOrderForResource(resource);
  if (!order) return;

  switch (eventType) {
    case "PAYMENT.CAPTURE.COMPLETED":
      if (resource.id && resource.amount && resource.status) await applyCapture(order.id, resource as PayPalCapture);
      break;
    case "PAYMENT.CAPTURE.DENIED":
      await db.order.update({
        where: { id: order.id },
        data: { paymentStatus: "DENIED", status: order.printfulOrderId ? order.status : "CANCELED", lastError: "PayPal denied the payment." },
      });
      break;
    case "PAYMENT.CAPTURE.REFUNDED":
    case "PAYMENT.CAPTURE.REVERSED":
      await markRefunded(order.id, eventType === "PAYMENT.CAPTURE.REVERSED" ? "REVERSED" : "REFUNDED");
      break;
  }
}

async function markRefunded(orderId: string, paymentStatus: string) {
  const order = await db.order.update({
    where: { id: orderId },
    data: { status: "REFUNDED", paymentStatus },
  });
  // Stop production if Printful has not started yet.
  if (order.printfulOrderId && CANCELLABLE.has(order.printfulStatus ?? "")) {
    await cancelPrintfulOrder(order.id).catch((error) =>
      console.error(`[checkout] Printful cancel after refund failed for ${order.invoiceNumber}`, error),
    );
    await db.order.update({ where: { id: order.id }, data: { status: "REFUNDED" } });
  }
  return order;
}

/** Full refund from the admin panel. */
export async function refundOrder(orderId: string) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (!order.paymentCaptureId) throw new Error("This order has no PayPal payment to refund.");
  await paypal.refundCapture(order.paymentCaptureId, `refund-${order.id}`);
  return markRefunded(order.id, "REFUNDED");
}
