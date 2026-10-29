import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

async function OrderNumber({ searchParams }: Pick<PageProps<"/checkout/success">, "searchParams">) {
  const { order } = await searchParams;
  const invoice = typeof order === "string" && /^[A-Z]+-\d+$/.test(order) ? order : null;
  if (!invoice) return null;
  return (
    <p className="mt-6 inline-block rounded-xl bg-paper px-5 py-3 text-sm">
      Order number <span className="font-mono text-base font-semibold">{invoice}</span>
    </p>
  );
}

export default function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-success-soft text-2xl text-success">✓</div>
      <h1 className="mt-6 text-h1">Thank you for your order!</h1>
      <p className="mt-3 text-muted-foreground">
        Your payment was received and your order is being prepared. PayPal will email you a receipt, and you&apos;ll get
        a tracking number as soon as it ships.
      </p>
      <Suspense fallback={null}>
        <OrderNumber searchParams={searchParams} />
      </Suspense>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/track" className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
          Track your order
        </Link>
        <Link href="/shop" className="inline-flex h-11 items-center rounded-lg border border-input bg-card px-5 text-sm font-semibold hover:border-foreground">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
