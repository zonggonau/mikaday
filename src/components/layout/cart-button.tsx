"use client";

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cart, useCart } from "@/lib/cart-store";

export function CartButton() {
  const { count } = useCart();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={() => cart.open()}
      aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
    >
      <ShoppingBag className="size-5" />
      {count > 0 && (
        <span
          className="absolute top-1 right-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] leading-5 font-semibold text-primary-foreground"
          aria-hidden
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Button>
  );
}
