import type { Metadata } from "next";
import { AiBadge } from "@/components/brand/ai-badge";
import { JournalCard } from "@/components/journal/journal-card";
import { JsonLd } from "@/components/seo/json-ld";
import { getArticles, getMikaProfile } from "@/lib/content";
import { blogJsonLd, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Journal: Stories from Mika's Everyday",
  description: "Slow mornings, design notes, and small adventures from Mika's world, plus the MIKADAY pieces that show up along the way.",
  path: "/journal",
});

export default async function JournalPage() {
  const [articles, mika] = await Promise.all([getArticles(), getMikaProfile()]);

  return (
    <div className="container-page py-12 lg:py-16">
      <JsonLd
        data={[
          blogJsonLd(articles),
          breadcrumbJsonLd([
            ["Home", "/"],
            ["Journal", "/journal"],
          ]),
        ]}
      />
      <header className="mb-12 max-w-2xl">
        <p className="text-eyebrow text-primary">Mika&apos;s journal</p>
        <h1 className="mt-2 text-h1">Notes from the everyday</h1>
        <p className="mt-4 text-lead text-muted-foreground">Slow mornings, design notes, and the little things worth writing down.</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <AiBadge />
          <p className="text-sm text-muted-foreground">{mika.disclosure}</p>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <JournalCard key={a.slug} article={a} headingLevel="h2" />
        ))}
      </div>
    </div>
  );
}
