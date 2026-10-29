"use client";

import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cart, type CartLine } from "@/lib/cart-store";
import { formatMoney } from "@/lib/format";

export function QuantityStepper({
  value,
  onChange,
  max = 20,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  max?: number;
  label: string;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-input bg-card" role="group" aria-label={`Quantity for ${label}`}>
      <Button variant="ghost" size="icon" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        <Minus />
      </Button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <Button variant="ghost" size="icon" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus />
      </Button>
    </div>
  );
}

export function CartLines({ lines, onNavigate }: { lines: CartLine[]; onNavigate?: () => void }) {
  return (
    <ul className="divide-y divide-border">
      {lines.map((line) => (
        <li key={line.variantId} className="flex gap-4 py-5">
          <Link
            href={`/shop/${line.slug}`}
            onClick={onNavigate}
            className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-border bg-card"
          >
            {line.imageUrl && <Image src={line.imageUrl} alt={line.name} fill sizes="96px" className="object-contain p-1.5" />}
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/shop/${line.slug}`} onClick={onNavigate} className="font-medium leading-snug hover:text-primary">
                  {line.name}
                </Link>
                {line.variantLabel && <p className="text-sm text-muted-foreground">{line.variantLabel}</p>}
                <p className="text-sm text-muted-foreground">{formatMoney(line.price, line.currency)} each</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => cart.remove(line.variantId)}
                aria-label={`Remove ${line.name}${line.variantLabel ? ` (${line.variantLabel})` : ""}`}
                className="-mt-1 -mr-2 shrink-0 text-muted-foreground"
              >
                <X />
              </Button>
            </div>
            <div className="mt-auto flex items-center justify-between gap-3 pt-2">
              <QuantityStepper
                value={line.quantity}
                onChange={(q) => cart.setQuantity(line.variantId, q)}
                label={line.name}
              />
              <p className="font-semibold tabular-nums">{formatMoney(line.price * line.quantity, line.currency)}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
