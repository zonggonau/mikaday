"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { CartLines } from "@/components/cart/cart-lines";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import { formatMoney } from "@/lib/format";

export function CartView({ currency }: { currency: string }) {
  const { items, count, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/shop">Browse the shop</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/collections">See collections</Link>
            </Button>
          </div>
        }
      >
        Items you add will stay here on this device until you check out.
      </EmptyState>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section aria-label="Cart items" className="rounded-2xl border border-border bg-card px-5">
        <CartLines lines={items} />
      </section>
      <aside aria-labelledby="summary" className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
        <h2 id="summary" className="text-h3">
          Order summary
        </h2>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              Subtotal ({count} item{count === 1 ? "" : "s"})
            </dt>
            <dd className="font-semibold tabular-nums">{formatMoney(subtotal, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd className="text-muted-foreground">Calculated at checkout</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Taxes &amp; duties</dt>
            <dd className="text-muted-foreground">If applicable</dd>
          </div>
        </dl>
        <p className="mt-5 text-xs text-muted-foreground">
          All prices are in {currency}. Prices are confirmed again at checkout before you pay.
        </p>
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href="/checkout">Continue to checkout</Link>
        </Button>
        <Button asChild variant="link" className="mt-2 w-full">
          <Link href="/shop">Keep shopping</Link>
        </Button>
      </aside>
    </div>
  );
}
