"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { PayPalButtons } from "@/components/paypal-buttons";
import { deliveryLabel, rateTitle } from "@/components/shipping-estimator";
import { cart, useCart } from "@/lib/cart-store";
import { formatMoney } from "@/lib/format";
import { trackEvent } from "@/lib/gtag";
import { useCountries } from "@/lib/use-countries";
import { capturePayPalOrder, createPayPalOrder, getCheckoutQuote, type CheckoutQuote } from "./actions";

interface Customer {
  email: string;
  phone: string;
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

const EMPTY_CUSTOMER: Customer = {
  email: "",
  phone: "",
  name: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  country: "",
};

type Item = { variantId: string; quantity: number };

/** A shipping quote is only valid for the exact cart and address it was calculated for. */
function quoteKey(items: Item[], c: Customer) {
  return JSON.stringify([items, c.country, c.state, c.zip, c.city, c.address1, c.address2]);
}

const field =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50 md:text-sm";
const label = "grid gap-1 text-sm font-medium";

export function CheckoutClient({ paypalClientId, currency }: { paypalClientId: string; currency: string }) {
  const router = useRouter();
  const { items: lines, subtotal: cartSubtotal } = useCart();
  const { countries, defaultCountry } = useCountries();
  const [form, setForm] = useState<Customer>(EMPTY_CUSTOMER);
  const [quote, setQuote] = useState<{ key: string; data: CheckoutQuote; notice: string | null } | null>(null);
  const [rateId, setRateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quoting, startQuoting] = useTransition();
  const [paid, setPaid] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const customer: Customer = { ...form, country: form.country || defaultCountry };
  const items: Item[] = lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity }));
  const active = quote?.key === quoteKey(items, customer) ? quote : null;
  const rate = active?.data.rates.find((r) => r.id === rateId) ?? null;
  const states = countries?.find((c) => c.code === customer.country)?.states ?? [];
  const subtotal = active ? active.data.subtotal : cartSubtotal;

  const set = (key: keyof Customer) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value, ...(key === "country" ? { state: "" } : {}) }));

  function calculateShipping(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (states.length > 0 && !customer.state) {
      setError("Please choose a state / province.");
      return;
    }
    const snapshot = customer;
    startQuoting(async () => {
      const result = await getCheckoutQuote(items, snapshot);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const data = result.quote;
      // Show the server's prices and drop anything that can no longer be sold.
      cart.reconcile(new Map(data.lines.map((l) => [l.variantId, l.unitPrice])), data.unavailable);
      const remaining = data.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity }));
      setQuote({
        key: quoteKey(remaining, snapshot),
        data,
        notice: data.unavailable.length
          ? `${data.unavailable.length} item${data.unavailable.length === 1 ? " was" : "s were"} removed because ${data.unavailable.length === 1 ? "it is" : "they are"} no longer available.`
          : null,
      });
      setRateId(data.rates[0]?.id ?? null);
      if (data.lines.length > 0 && data.rates.length === 0) {
        setError("We can't ship to this address. Please check it and try again.");
      }
    });
  }

  async function createOrder() {
    setError(null);
    if (!rate) throw new Error("No shipping method selected");
    const result = await createPayPalOrder(items, customer, rate.id);
    if (!result.ok) {
      setError(result.error);
      throw new Error(result.error);
    }
    return result.paypalOrderId;
  }

  async function onApprove(paypalOrderId: string): Promise<"done" | "restart"> {
    setCapturing(true);
    setError(null);
    const result = await capturePayPalOrder(paypalOrderId);
    if (!result.ok) {
      setCapturing(false);
      setError(result.error);
      return result.restart ? "restart" : "done";
    }
    trackEvent("purchase", {
      transaction_id: result.invoiceNumber,
      value: result.total,
      currency: result.currency,
      shipping: rate?.rate,
      items: lines.map((l) => ({ item_id: l.variantId, item_name: l.name, price: l.price, quantity: l.quantity })),
    });
    setPaid(true);
    cart.clear();
    router.push(`/checkout/success?order=${encodeURIComponent(result.invoiceNumber)}`);
    return "done";
  }

  if (paid) {
    return <p className="rounded-2xl border border-line bg-card p-8 text-center">Payment received — loading your order…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-16 text-center">
        <p className="font-medium">Your cart is empty.</p>
        <Link href="/shop" className="mt-4 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_400px]">
      <div className="space-y-8">
        <form onSubmit={calculateShipping} className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">1. Contact</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className={label}>
                Email
                <input className={field} type="email" required autoComplete="email" value={form.email} onChange={(e) => set("email")(e.target.value)} />
                <span className="text-xs font-normal text-muted-foreground">For your order confirmation and tracking.</span>
              </label>
              <label className={label}>
                Phone (optional)
                <input className={field} type="tel" autoComplete="tel" maxLength={30} value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
                <span className="text-xs font-normal text-muted-foreground">Only shared with the carrier if needed.</span>
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">2. Shipping address</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className={`${label} sm:col-span-2`}>
                Full name
                <input className={field} required minLength={2} maxLength={100} autoComplete="name" value={form.name} onChange={(e) => set("name")(e.target.value)} />
              </label>
              <label className={`${label} sm:col-span-2`}>
                Country
                <select className={field} required autoComplete="country" value={customer.country} onChange={(e) => set("country")(e.target.value)} disabled={!countries}>
                  {!countries && <option>Loading…</option>}
                  {countries?.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`${label} sm:col-span-2`}>
                Street address
                <input className={field} required minLength={3} maxLength={200} autoComplete="address-line1" value={form.address1} onChange={(e) => set("address1")(e.target.value)} />
              </label>
              <label className={`${label} sm:col-span-2`}>
                Apartment, suite, etc. (optional)
                <input className={field} maxLength={200} autoComplete="address-line2" value={form.address2} onChange={(e) => set("address2")(e.target.value)} />
              </label>
              <label className={label}>
                City
                <input className={field} required maxLength={100} autoComplete="address-level2" value={form.city} onChange={(e) => set("city")(e.target.value)} />
              </label>
              {states.length > 0 && (
                <label className={label}>
                  State / province
                  <select className={field} required autoComplete="address-level1" value={form.state} onChange={(e) => set("state")(e.target.value)}>
                    <option value="">Select…</option>
                    {states.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className={label}>
                ZIP / postal code
                <input className={field} maxLength={20} autoComplete="postal-code" value={form.zip} onChange={(e) => set("zip")(e.target.value)} />
              </label>
            </div>
            <button
              type="submit"
              disabled={quoting || !countries}
              className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
            >
              {quoting ? "Calculating shipping…" : active ? "Recalculate shipping" : "Continue to shipping"}
            </button>
            {quote && !active && !quoting && (
              <p className="text-sm text-muted-foreground">Your cart or address changed — recalculate shipping to continue.</p>
            )}
          </section>
        </form>

        {active && active.data.rates.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">3. Shipping method</h2>
            {active.notice && <p className="rounded-xl bg-warning-soft p-3 text-sm text-warning">{active.notice}</p>}
            <div className="divide-y divide-line rounded-2xl border border-line bg-card">
              {active.data.rates.map((r) => (
                <label key={r.id} className="flex cursor-pointer items-start gap-3 p-4 text-sm">
                  <input type="radio" name="rate" className="mt-1 accent-ink" checked={r.id === rateId} onChange={() => setRateId(r.id)} />
                  <span className="flex-1">
                    <span className="block font-medium">{rateTitle(r.name)}</span>
                    {deliveryLabel(r) && <span className="text-muted-foreground">{deliveryLabel(r)} after production</span>}
                  </span>
                  <span className="font-semibold">{formatMoney(r.rate, r.currency)}</span>
                </label>
              ))}
            </div>
          </section>
        )}

        {active && rate && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">4. Payment</h2>
            <p className="text-sm text-muted-foreground">Pay with PayPal or any debit / credit card. You won&apos;t be charged until you confirm.</p>
            {paypalClientId ? (
              <div className={capturing ? "pointer-events-none opacity-50" : ""}>
                <PayPalButtons
                  clientId={paypalClientId}
                  currency={currency}
                  createOrder={createOrder}
                  onApprove={onApprove}
                  onError={() => setError((current) => current ?? "The payment could not be completed. Please try again.")}
                />
              </div>
            ) : (
              <p className="rounded-xl bg-warning-soft p-3 text-sm text-warning">Online payment is not available yet. Please check back soon.</p>
            )}
            {capturing && <p className="text-sm text-muted-foreground">Confirming your payment…</p>}
          </section>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-line bg-card p-5 lg:sticky lg:top-24">
        <h2 className="font-semibold">Order summary</h2>
        <ul className="divide-y divide-line">
          {lines.map((l) => (
            <li key={l.variantId} className="flex items-center gap-3 py-3 text-sm">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-line bg-paper">
                {l.imageUrl && <Image src={l.imageUrl} alt="" fill sizes="56px" className="object-contain" />}
                <span className="absolute -top-0 right-0 rounded-bl-lg bg-ink px-1.5 text-xs text-white">{l.quantity}</span>
              </span>
              <span className="flex-1">
                <span className="block font-medium leading-snug">{l.name}</span>
                {l.variantLabel && <span className="text-xs text-muted-foreground">{l.variantLabel}</span>}
              </span>
              <span className="font-medium">{formatMoney(l.price * l.quantity, l.currency)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatMoney(subtotal, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd>{rate ? formatMoney(rate.rate, rate.currency) : <span className="text-muted-foreground">Next step</span>}</dd>
          </div>
          <div className="flex justify-between pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatMoney(subtotal + (rate?.rate ?? 0), currency)}</dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">Import duties or taxes may be charged by your country on delivery.</p>
      </aside>
    </div>
  );
}
