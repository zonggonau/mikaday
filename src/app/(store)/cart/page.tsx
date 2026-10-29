import type { Metadata } from "next";
import { site } from "@/lib/site";
import { CartView } from "./cart-view";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <h1 className="mb-10 text-h1">Your cart</h1>
      <CartView currency={site.currency} />
    </div>
  );
}
