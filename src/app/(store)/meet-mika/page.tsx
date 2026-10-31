import { ArrowRight, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AiBadge } from "@/components/brand/ai-badge";
import { SectionHeading } from "@/components/empty-state";
import { JournalCard } from "@/components/journal/journal-card";
import { ImageSlot } from "@/components/media/image-slot";
import { ProductGrid } from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { getProductsByIds } from "@/lib/catalog";
import { getArticles, getCollections, getMikaProfile } from "@/lib/content";
import { MEET_MIKA_OG_IMAGE, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Meet Mika, the AI Virtual Creator",
  description: "Meet Mika, the AI virtual creator behind MIKADAY: slow mornings, sketchbooks, and weekend adventures that inspire our original designs.",
  path: "/meet-mika",
  image: MEET_MIKA_OG_IMAGE,
});

export default async function MeetMikaPage() {
  const [mika, articles, collections] = await Promise.all([getMikaProfile(), getArticles(), getCollections()]);
  const products = await getProductsByIds([...new Set(collections.flatMap((c) => c.productIds))]);

  return (
    <>
      <section aria-labelledby="meet-mika" className="container-page grid grid-cols-1 items-center gap-10 pt-10 pb-16 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] md:gap-16 lg:pt-16">
        <ImageSlot image={mika.portrait} aspect="4 / 5" priority sizes="(min-width: 768px) 480px, 100vw" className="mx-auto w-full max-w-[480px]" />
        <div className="flex flex-col items-start gap-5">
          <AiBadge />
          <p className="text-eyebrow text-primary">Meet Mika</p>
          <h1 id="meet-mika" className="text-display">
            Create. Sip. Explore.
          </h1>
          <p className="text-lead text-muted-foreground">{mika.shortBio}</p>
          <dl className="grid w-full grid-cols-3 gap-4 border-y border-border py-5 text-sm">
            <div>
              <dt className="text-muted-foreground">Age</dt>
              <dd className="font-semibold">{mika.age}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Home base</dt>
              <dd className="font-semibold">{mika.hometown}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Identity</dt>
              <dd className="font-semibold capitalize">{mika.role}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="her-world" className="bg-secondary py-20">
        <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 id="her-world" className="text-h2">
              Her world
            </h2>
            <div className="prose-mika mt-6 text-lead text-muted-foreground">
              {mika.bio.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </div>
          <ImageSlot image={mika.workspace} aspect="4 / 3" sizes="(min-width: 1024px) 560px, 100vw" />
        </div>
      </section>

      <section aria-labelledby="interests" className="container-page py-20">
        <SectionHeading id="interests" eyebrow="What inspires her" title="Coffee, sketches, and the long way home" />
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {mika.interests.map((item) => (
            <li key={item.title} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-h3">{item.title}</h3>
              <p className="mt-3 text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="disclosure" className="container-page">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:p-8">
          <Info className="size-6 shrink-0 text-primary" aria-hidden />
          <div>
            <h2 id="disclosure" className="font-semibold">
              About Mika&apos;s identity
            </h2>
            <p className="mt-2 text-muted-foreground">
              {mika.disclosure} Mika is not a real person, has no real clients or credentials, and her travels and routines are
              imagined. Images of Mika are illustrations or AI-generated images and are labelled as such. Product images are mockups of real items.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="mika-journal" className="container-page py-20">
        <SectionHeading
          id="mika-journal"
          eyebrow="From her journal"
          title="Read Mika's stories"
          action={
            <Button asChild variant="link">
              <Link href="/journal">
                All stories <ArrowRight />
              </Link>
            </Button>
          }
        />
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 3).map((a) => (
            <JournalCard key={a.slug} article={a} />
          ))}
        </div>
      </section>

      {products.length > 0 && (
        <section aria-labelledby="mika-products" className="container-page pb-8">
          <SectionHeading id="mika-products" eyebrow="Inspired by her world" title="Pieces from Mika's collections" />
          <ProductGrid products={products} />
        </section>
      )}
    </>
  );
}
