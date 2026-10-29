"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/cart-store";
import { formatMoney } from "@/lib/format";
import { useCountries } from "@/lib/use-countries";

interface Rate {
  id: string;
  name: string;
  rate: number;
  currency: string;
  minDeliveryDays: number | null;
  maxDeliveryDays: number | null;
}

type Line = { variantId: string; quantity: number };

export function deliveryLabel(rate: Pick<Rate, "minDeliveryDays" | "maxDeliveryDays">) {
  const { minDeliveryDays: min, maxDeliveryDays: max } = rate;
  if (!min && !max) return null;
  return min && max && min !== max ? `${min}–${max} business days` : `${max ?? min} business days`;
}

/** Printful rate names end with "(Estimated delivery: …)"; the days are shown separately. */
export function rateTitle(name: string) {
  return name.replace(/\s*\(.*\)\s*$/, "");
}

export const selectClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50 md:text-sm";

/**
 * Live shipping rates from the fulfillment provider. Pass `items` for a single product,
 * or `source="cart"` to quote whatever is currently in the cart.
 */
export function ShippingEstimator({ items, source = "items", idPrefix = "estimate" }: { items?: Line[]; source?: "items" | "cart"; idPrefix?: string }) {
  const cart = useCart();
  const lines: Line[] =
    source === "cart" ? cart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })) : (items ?? []);

  const { countries, defaultCountry, error: countriesError } = useCountries();
  const [chosenCountry, setCountry] = useState<string | null>(null);
  const country = chosenCountry ?? defaultCountry;
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ signature: string; rates: Rate[] } | null>(null);

  const states = countries?.find((c) => c.code === country)?.states ?? [];
  const signature = JSON.stringify([lines, country, state, zip]);
  const rates = result?.signature === signature ? result.rates : null;

  async function estimate(event: FormEvent) {
    event.preventDefault();
    if (lines.length === 0) {
      setError(source === "cart" ? "Add something to your cart first." : "Choose your options first.");
      return;
    }
    if (states.length > 0 && !state) {
      setError("Please choose a state or province.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shipping/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode: country, stateCode: state || undefined, zip: zip || undefined, items: lines }),
      });
      const data = (await res.json().catch(() => ({}))) as { rates?: Rate[]; error?: string };
      if (!res.ok || !data.rates) throw new Error(data.error ?? "Could not calculate shipping.");
      setResult({ signature, rates: data.rates });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not calculate shipping.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={estimate} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-country`}>Country</Label>
          <select
            id={`${idPrefix}-country`}
            className={selectClass}
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setState("");
            }}
            disabled={!countries}
          >
            {!countries && <option>Loading…</option>}
            {countries?.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {states.length > 0 && (
          <div className="grid gap-1.5">
            <Label htmlFor={`${idPrefix}-state`}>State / province</Label>
            <select id={`${idPrefix}-state`} className={selectClass} value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">Select…</option>
              {states.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className={`grid gap-1.5 ${states.length ? "" : "sm:col-span-2"}`}>
          <Label htmlFor={`${idPrefix}-zip`}>ZIP / postal code (optional)</Label>
          <Input id={`${idPrefix}-zip`} value={zip} onChange={(e) => setZip(e.target.value)} maxLength={20} autoComplete="postal-code" />
        </div>
        <Button type="submit" variant="outline" disabled={loading || !countries} className="sm:col-span-2">
          {loading ? "Calculating…" : "Calculate shipping"}
        </Button>
      </form>

      <div aria-live="polite">
        {(error || countriesError) && <p className="mt-3 text-sm text-destructive">{error ?? "Could not load the country list."}</p>}
        {rates && (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
            {rates.length === 0 && <li className="p-3 text-sm text-muted-foreground">We can&apos;t ship to this destination yet.</li>}
            {rates.map((rate) => (
              <li key={rate.id} className="flex items-start justify-between gap-4 p-3 text-sm">
                <div>
                  <p className="font-medium">{rateTitle(rate.name)}</p>
                  {deliveryLabel(rate) && <p className="text-muted-foreground">Estimated {deliveryLabel(rate)} after production</p>}
                </div>
                <p className="shrink-0 font-semibold tabular-nums">{formatMoney(rate.rate, rate.currency)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
