"use client";

import Image from "next/image";
import { useActionState } from "react";
import { preservingSubmit } from "@/lib/use-preserving-form";
import { formatDate, formatMoney } from "@/lib/format";
import { trackOrder, type TrackedOrder, type TrackState } from "./actions";

const STEPS = ["Order placed", "In production", "Shipped", "Delivered"];

function progress({ status, shipments }: TrackedOrder) {
  if (status === "SHIPPED" && shipments.length > 0 && shipments.every((s) => s.deliveredAt)) return 3;
  switch (status) {
    case "PROCESSING":
    case "ON_HOLD":
      return 1;
    case "PARTIAL":
    case "SHIPPED":
    case "RETURNED":
      return 2;
    default:
      return 0;
  }
}

function statusNote(status: TrackedOrder["status"]) {
  switch (status) {
    case "CANCELED":
      return "This order was cancelled. If you were charged, a refund has been issued.";
    case "REFUNDED":
      return "This order was refunded to your original payment method.";
    case "RETURNED":
      return "This package was returned to the sender. We'll contact you by email.";
    case "ON_HOLD":
    case "FAILED":
      return "Your order needs a quick review by our team. We'll contact you by email if we need anything.";
    case "PARTIAL":
      return "Part of your order has shipped. The rest is on its way soon.";
    default:
      return null;
  }
}

function OrderResult({ order }: { order: TrackedOrder }) {
  const step = progress(order);
  const note = statusNote(order.status);

  return (
    <div className="mt-8 space-y-6 rounded-2xl border border-line bg-card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-lg font-semibold">Order {order.invoiceNumber}</p>
        <p className="text-sm text-muted-foreground">Placed {formatDate(order.placedAt)}</p>
      </div>

      {order.status !== "CANCELED" && order.status !== "REFUNDED" && (
        <ol className="grid grid-cols-4 gap-2">
          {STEPS.map((label, i) => (
            <li key={label}>
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-line"}`} />
              <p className={`mt-2 text-xs font-medium ${i <= step ? "text-ink" : "text-muted-foreground"}`}>{label}</p>
            </li>
          ))}
        </ol>
      )}
      {note && <p className="rounded-xl bg-paper p-3 text-sm text-ink-soft">{note}</p>}

      {order.shipments.length > 0 && (
        <div className="space-y-3">
          <p className="font-medium">Shipments</p>
          {order.shipments.map((s, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4 text-sm">
              <div>
                <p className="font-medium">{[s.carrier, s.service].filter(Boolean).join(" · ") || "Shipment"}</p>
                <p className="text-muted-foreground">
                  {s.trackingNumber ? `Tracking ${s.trackingNumber}` : "Tracking number pending"}
                  {s.deliveredAt
                    ? ` · delivered ${formatDate(s.deliveredAt)}`
                    : s.shippedAt
                      ? ` · shipped ${formatDate(s.shippedAt)}`
                      : ""}
                </p>
              </div>
              {s.trackingUrl && (
                <a
                  href={s.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                >
                  Track package →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <ul className="divide-y divide-line">
        {order.items.map((item, i) => (
          <li key={i} className="flex items-center gap-4 py-3 text-sm">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-line bg-paper">
              {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-contain" />}
            </div>
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-muted-foreground">
                {[item.variant, `Qty ${item.quantity}`].filter(Boolean).join(" · ")}
              </p>
            </div>
            <p className="font-medium">{formatMoney(item.price * item.quantity, order.currency)}</p>
          </li>
        ))}
      </ul>
      <div className="flex justify-between border-t border-line pt-4 text-sm">
        <span className="text-muted-foreground">{order.shippingMethod ?? "Total"}</span>
        <span className="font-semibold">Total {formatMoney(order.total, order.currency)}</span>
      </div>
    </div>
  );
}

const field =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50 md:text-sm";

export function TrackForm({ defaultInvoice = "" }: { defaultInvoice?: string }) {
  const [state, formAction, pending] = useActionState<TrackState, FormData>(trackOrder, {});

  return (
    <>
      <form onSubmit={preservingSubmit(formAction)} className="grid grid-cols-1 gap-4 rounded-2xl border border-line bg-card p-6 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Order number
          <input name="invoice" required placeholder="ORD-1001" defaultValue={defaultInvoice} className={field} autoComplete="off" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Email used at checkout
          <input name="email" type="email" required placeholder="you@example.com" className={field} autoComplete="email" />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60 sm:col-span-2"
        >
          {pending ? "Looking up your order…" : "Track order"}
        </button>
        {state.error && <p className="text-sm text-danger sm:col-span-2">{state.error}</p>}
      </form>
      {state.order && <OrderResult order={state.order} />}
    </>
  );
}
