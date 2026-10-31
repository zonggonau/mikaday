import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PolicyView } from "@/components/policy-view";
import { ShippingEstimator } from "@/components/shipping-estimator";
import { getPolicy } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Shipping",
  description: "How MIKADAY orders are printed and shipped, with live shipping rates for your cart and destination.",
  path: "/shipping",
});

export default async function ShippingPage() {
  const policy = await getPolicy("shipping");
  if (!policy) notFound();

  return (
    <div className="container-page py-12 lg:py-16">
      <PolicyView
        policy={policy}
        aside={
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-h3">Estimate shipping for your cart</h2>
            <p className="mt-2 mb-5 text-sm text-muted-foreground">
              Live options from our fulfillment provider. Add items to your cart first.
            </p>
            <ShippingEstimator source="cart" idPrefix="shipping-page" />
            <p className="mt-6 text-sm text-muted-foreground">
              Already ordered?{" "}
              <Link href="/track" className="font-semibold text-primary hover:underline">
                Track your order
              </Link>
            </p>
          </div>
        }
      />
    </div>
  );
}
