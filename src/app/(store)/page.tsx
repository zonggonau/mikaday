import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AiBadge } from "@/components/brand/ai-badge";
import { CollectionBanner } from "@/components/collection/collection-banner";
import { SectionHeading } from "@/components/empty-state";
import { FollowMika } from "@/components/home/follow-mika";
import { ShopTheMoment } from "@/components/home/shop-the-moment";
import { JournalCard } from "@/components/journal/journal-card";
import { ImageSlot } from "@/components/media/image-slot";
import { ProductGrid } from "@/components/product/product-grid";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { getProductsByIds, getPublishedProducts } from "@/lib/catalog";
import { getArticles, getCollections, getHomeContent, getMikaProfile } from "@/lib/content";
import { organizationJsonLd, pageMetadata, websiteJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: { absolute: `${site.name} — Original Mugs & Everyday Designs from Mika's World` },
  description:
    "Original MIKADAY designs inspired by Mika, an AI virtual creator, starting with the Mountain Sunset Mug. Printed to order and shipped internationally.",
  path: "/",
});

async function EverydayFavorites() {
  const products = await getPublishedProducts();
  const featured = products.filter((p) => p.featured);
  const picks = (featured.length >= 4 ? featured : products).slice(0, 4);
  if (picks.length === 0) return null;

  return (
    <section aria-labelledby="favorites" className="container-page py-20">
      <SectionHeading
        id="favorites"
        eyebrow="Everyday favorites"
        title="Small things that make the day"
        action={
          <Button asChild variant="link">
            <Link href="/shop">
              Shop all <ArrowRight />
            </Link>
          </Button>
        }
      />
      <ProductGrid products={picks} />
    </section>
  );
}

async function ShopTheMomentSection() {
  const { shopTheMoment } = await getHomeContent();
  const products = await getProductsByIds(shopTheMoment.productIds);
  return (
    <div className="container-page py-20">
      <ShopTheMoment {...shopTheMoment} products={products} />
    </div>
  );
}

export default async function HomePage() {
  const [{ hero }, mika, collections, articles] = await Promise.all([
    getHomeContent(),
    getMikaProfile(),
    getCollections(),
    getArticles(),
  ]);
  const featuredCollection = collections[0];

  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      {/* 1. Hero */}
      <section aria-labelledby="hero-title" className="container-page grid grid-cols-1 items-center gap-10 pt-10 pb-16 lg:grid-cols-2 lg:gap-16 lg:pt-16 lg:pb-24">
        <div className="flex flex-col items-start gap-6">
          <AiBadge />
          <p className="text-eyebrow text-primary">{hero.eyebrow}</p>
          <h1 id="hero-title" className="text-display text-balance">
            {hero.headline}
          </h1>
          <p className="max-w-xl text-lead text-muted-foreground">{hero.text}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={featuredCollection ? `/collections/${featuredCollection.slug}` : "/shop"}>Shop the Collection</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/meet-mika">Meet Mika</Link>
            </Button>
          </div>
        </div>
        <ImageSlot image={hero.image} aspect="4 / 5" priority sizes="(min-width: 1024px) 560px, 100vw" className="w-full lg:max-w-[560px] lg:justify-self-end" />
      </section>

      {/* 2. A little about Mika */}
      <section aria-labelledby="about-mika" className="bg-secondary py-20">
        <div className="container-page grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] md:gap-16">
          <ImageSlot image={mika.portrait} aspect="4 / 5" sizes="(min-width: 768px) 420px, 100vw" className="mx-auto w-full max-w-[420px]" />
          <div>
            <p className="text-eyebrow text-primary">A little about Mika</p>
            <h2 id="about-mika" className="mt-2 text-h2">
              Hi, I&apos;m Mika.
            </h2>
            <p className="mt-5 text-lead text-muted-foreground">{mika.shortBio}</p>
            <p className="mt-4 text-sm text-muted-foreground">{mika.disclosure}</p>
            <Button asChild variant="outline" className="mt-8">
              <Link href="/meet-mika">
                Step Into My World <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Everyday favorites */}
      <EverydayFavorites />

      {/* 4. Shop the moment */}
      <div className="bg-secondary">
        <ShopTheMomentSection />
      </div>

      {/* 5. Collection */}
      {featuredCollection && (
        <div className="container-page py-20">
          <CollectionBanner collection={featuredCollection} />
        </div>
      )}

      {/* 6. Journal */}
      <section aria-labelledby="journal" className="container-page py-12">
        <SectionHeading
          id="journal"
          eyebrow="From Mika's journal"
          title="Stories from the everyday"
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

      {/* 7. Follow Mika */}
      <div className="container-page py-16">
        <FollowMika />
      </div>
    </>
  );
}
