"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cart, useCart } from "@/lib/cart-store";
import { formatMoney } from "@/lib/format";
import { CartLines } from "./cart-lines";

export function CartDrawer({ currency }: { currency: string }) {
  const { items, count, subtotal, isOpen } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? cart.open() : cart.close())}>
      <SheetContent side="right" className="gap-0 bg-background p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="font-serif text-xl font-medium">Your cart</SheetTitle>
          <SheetDescription>
            {count === 0 ? "Nothing here yet." : `${count} item${count === 1 ? "" : "s"}`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-secondary" aria-hidden>
              <ShoppingBag className="size-6 text-muted-foreground" />
            </span>
            <p className="max-w-[26ch] text-muted-foreground">Your cart is empty. Find something for your everyday.</p>
            <Button asChild onClick={() => cart.close()}>
              <Link href="/shop">Browse the shop</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              <CartLines lines={items} onNavigate={() => cart.close()} />
            </div>
            <SheetFooter className="gap-3 border-t border-border bg-card px-5 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatMoney(subtotal, currency)} <span className="text-xs font-medium text-muted-foreground">{currency}</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Shipping and any applicable taxes are calculated at checkout.</p>
              <Button asChild size="lg" onClick={() => cart.close()}>
                <Link href="/checkout">Checkout</Link>
              </Button>
              <Button asChild variant="outline" onClick={() => cart.close()}>
                <Link href="/cart">View cart</Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
