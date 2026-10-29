import type { Metadata } from "next";
import { TrackForm } from "./track-form";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the production and shipping status of your order.",
};

export default function TrackPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-h1">Track your order</h1>
        <p className="mt-3 mb-8 text-muted-foreground">
          Enter the order number from your confirmation email and the email address you used at checkout.
        </p>
        <TrackForm />
      </div>
    </div>
  );
}
