import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about an order or a product? Send MIKADAY a message.",
};

export default function ContactPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
        <div>
          <p className="text-eyebrow text-primary">Contact</p>
          <h1 className="mt-2 text-h1">We&apos;re happy to help</h1>
          <p className="mt-4 text-lead text-muted-foreground">
            Questions about an order, a product, or a design? Send us a message and we&apos;ll reply by email.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            <li>
              Checking on an order?{" "}
              <Link href="/track" className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline">
                Track it here
              </Link>
            </li>
            <li>
              Quick answers in the{" "}
              <Link href="/faq" className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline">
                FAQ
              </Link>
            </li>
            {site.supportEmail && (
              <li>
                Or email{" "}
                <a href={`mailto:${site.supportEmail}`} className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline">
                  {site.supportEmail}
                </a>
              </li>
            )}
          </ul>
          <p className="mt-8 text-sm text-muted-foreground">
            Note: Mika is an AI virtual creator, so messages are answered by the MIKADAY team.
          </p>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
