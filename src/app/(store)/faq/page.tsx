import type { Metadata } from "next";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { getFaq } from "@/lib/content";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about Mika, our products, shipping, payment, and orders.",
};

export default async function FaqPage() {
  const faq = await getFaq();

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-eyebrow text-primary">Help</p>
        <h1 className="mt-2 text-h1">Frequently asked questions</h1>
        <Accordion type="multiple" className="mt-10 border-y border-border">
          {faq.map((item, i) => (
            <AccordionItem key={item.question} value={`q${i}`}>
              <AccordionTrigger className="min-h-14 py-4 text-base font-semibold">{item.question}</AccordionTrigger>
              <AccordionContent className="pb-5 text-base leading-relaxed text-muted-foreground">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-12 rounded-2xl border border-border bg-card p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h2 className="font-semibold">Still have a question?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Send us a message and we&apos;ll get back to you.</p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
