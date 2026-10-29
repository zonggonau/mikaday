import type { Metadata } from "next";
import { site } from "@/lib/site";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="container-page py-10 lg:py-14">
      <h1 className="mb-10 text-h1">Checkout</h1>
      <CheckoutClient paypalClientId={site.paypalClientId} currency={site.currency} />
    </div>
  );
}
