import { NextResponse, type NextRequest } from "next/server";
import { handlePayPalEvent } from "@/lib/checkout";
import { env } from "@/lib/env";
import { paypal } from "@/lib/paypal";

/**
 * PayPal webhook receiver. Add it in the PayPal developer dashboard (your app → Webhooks):
 * {SITE_URL}/api/paypal/webhook with the PAYMENT.CAPTURE.* events, then put the Webhook ID
 * in PAYPAL_WEBHOOK_ID. Catches payments that complete after review, refunds and reversals.
 */
export async function POST(request: NextRequest) {
  if (!env.paypalWebhookId) {
    console.error("[paypal-webhook] PAYPAL_WEBHOOK_ID is not set; cannot verify events");
    return NextResponse.json({ error: "Webhook verification is not configured" }, { status: 503 });
  }

  const event = (await request.json().catch(() => null)) as
    | { event_type?: string; resource?: Parameters<typeof handlePayPalEvent>[1] }
    | null;
  if (!event?.event_type || !event.resource) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const verified = await paypal.verifyWebhook(request.headers, event).catch(() => false);
  if (!verified) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  try {
    await handlePayPalEvent(event.event_type, event.resource);
  } catch (error) {
    console.error(`[paypal-webhook] ${event.event_type} failed`, error);
    // A non-2xx response makes PayPal retry the delivery.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
