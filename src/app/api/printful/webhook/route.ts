import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { safeEqual } from "@/lib/auth";
import { PRODUCTS_TAG } from "@/lib/catalog";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { applyPrintfulOrder, handlePackageShipped } from "@/lib/orders";
import type { PfOrder, PfShipment, PfSyncProduct } from "@/lib/printful";
import { syncProductFromWebhook } from "@/lib/sync";

interface PrintfulEvent {
  type: string;
  created: number;
  retries: number;
  store: number;
  data: {
    order?: PfOrder;
    shipment?: PfShipment;
    reason?: string;
    sync_product?: PfSyncProduct;
  };
}

/**
 * Printful webhook receiver. Register it (Admin → Settings) as
 * {SITE_URL}/api/printful/webhook?secret={SYNC_WEBHOOK_SECRET}.
 * Printful v1 webhooks are unsigned, so the secret in the URL authenticates the call.
 */
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret") ?? "";
  if (!safeEqual(secret, env.webhookSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = (await request.json().catch(() => null)) as PrintfulEvent | null;
  if (!event?.type || !event.data) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { order, shipment, reason, sync_product: product } = event.data;

  try {
    switch (event.type) {
      case "product_synced":
      case "product_updated":
        if (product) {
          await syncProductFromWebhook(product);
          // Expire immediately so the storefront never shows a price the checkout would reject.
          revalidateTag(PRODUCTS_TAG, { expire: 0 });
        }
        break;

      case "product_deleted":
        if (product) {
          await db.product.updateMany({
            where: { id: BigInt(product.id) },
            data: { deletedAt: new Date(), published: false },
          });
          revalidateTag(PRODUCTS_TAG, { expire: 0 });
        }
        break;

      case "package_shipped":
        if (order && shipment) await handlePackageShipped(order, shipment);
        break;

      case "package_returned":
        if (order) await applyPrintfulOrder(order, undefined, { status: "RETURNED", lastError: reason ?? null });
        break;

      case "order_failed":
        if (order) await applyPrintfulOrder(order, undefined, { status: "FAILED", lastError: reason ?? "Order failed in Printful" });
        break;

      case "order_canceled":
        if (order) await applyPrintfulOrder(order, undefined, { status: "CANCELED", lastError: reason ?? null });
        break;

      case "order_put_hold":
        if (order) await applyPrintfulOrder(order, undefined, { status: "ON_HOLD", lastError: reason ?? null });
        break;

      case "order_created":
      case "order_updated":
      case "order_remove_hold":
        if (order) await applyPrintfulOrder(order);
        break;

      default:
        // Unhandled event types are acknowledged so Printful does not retry them.
        break;
    }
  } catch (error) {
    console.error(`[printful-webhook] ${event.type} failed`, error);
    // A non-2xx response makes Printful retry with back-off.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
