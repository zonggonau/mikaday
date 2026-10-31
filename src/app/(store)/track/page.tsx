import type { Metadata } from "next";
import { Suspense } from "react";
import { pageMetadata } from "@/lib/seo";
import { TrackForm } from "./track-form";

export const metadata: Metadata = pageMetadata({
  title: "Track your order",
  description: "Check the production and shipping status of your order.",
  path: "/track",
  noindex: true, // personal order lookups; also disallowed in robots.txt
});

/** Links in order emails carry ?order=ORD-…; the email address is never put in the URL. */
async function PrefilledTrackForm({ searchParams }: Pick<PageProps<"/track">, "searchParams">) {
  const { order } = await searchParams;
  return <TrackForm defaultInvoice={typeof order === "string" ? order.slice(0, 40) : ""} />;
}

export default function TrackPage({ searchParams }: PageProps<"/track">) {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-h1">Track your order</h1>
        <p className="mt-3 mb-8 text-muted-foreground">
          Enter the order number from your confirmation email and the email address you used at checkout.
        </p>
        <Suspense fallback={<TrackForm />}>
          <PrefilledTrackForm searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
