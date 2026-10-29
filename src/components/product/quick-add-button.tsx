"use client";

import { Button } from "@/components/ui/button";
import type { ProductSummary } from "@/lib/catalog";
import { cart } from "@/lib/cart-store";
import { trackEvent } from "@/lib/gtag";

/** Adds a single-variant product straight from a product card. */
export function QuickAddButton({ product }: { product: ProductSummary }) {
  const variant = product.singleVariant;
  if (!variant) return null;

  return (
    <Button
      className="w-full"
      disabled={!variant.available}
      onClick={() => {
        cart.add(
          {
            variantId: variant.id,
            name: product.title,
            variantLabel: variant.label,
            price: variant.price,
            currency: product.currency,
            imageUrl: variant.imageUrl ?? product.imageUrl,
            slug: product.slug,
          },
          1,
        );
        trackEvent("add_to_cart", {
          currency: product.currency,
          value: variant.price,
          items: [{ item_id: variant.id, item_name: product.title, price: variant.price, quantity: 1 }],
        });
        cart.open();
      }}
    >
      {variant.available ? "Add to cart" : "Currently unavailable"}
    </Button>
  );
}
