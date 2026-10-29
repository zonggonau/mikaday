import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CollectionArt, CollectionBanner } from "@/components/collection/collection-banner";
import { SectionHeading } from "@/components/empty-state";
import { JournalCard } from "@/components/journal/journal-card";
import { ProductGrid, productGridClass } from "@/components/product/product-grid";
import { getProductsByIds } from "@/lib/catalog";
import { getArticles, getCollection, getCollections } from "@/lib/content";

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const collection = await getCollection((await params).slug);
  if (!collection) return { title: "Collection not found" };
  return { title: `${collection.name} Collection`, description: collection.summary };
}

async function Content({ params }: Pick<PageProps<"/collections/[slug]">, "params">) {
  const collection = await getCollection((await params).slug);
  if (!collection) notFound();

  const [products, articles] = await Promise.all([getProductsByIds(collection.productIds), getArticles()]);
  const stories = articles.filter((a) => a.productIds.some((id) => collection.productIds.includes(id))).slice(0, 3);

  return (
    <div className="container-page py-10 lg:py-14">
      <CollectionBanner collection={collection} headingLevel="h1" showButton={false} />

      <section aria-labelledby="collection-story" className="mx-auto mt-16 max-w-2xl">
        <h2 id="collection-story" className="text-h2">
          The story
        </h2>
        <div className="prose-mika mt-5 text-lead text-muted-foreground">
          {collection.story.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
      </section>

      <section aria-labelledby="collection-pieces" className="mt-20">
        <SectionHeading id="collection-pieces" eyebrow={`${collection.name} collection`} title="Shop the pieces" />
        {products.length > 0 && <ProductGrid products={products} />}
        {collection.upcoming.length > 0 && (
          <div className={products.length > 0 ? "mt-14" : ""}>
            <h3 className="mb-6 text-h3">Coming to the collection</h3>
            <ul className={productGridClass}>
              {collection.upcoming.map((item) => (
                <li key={item.name} className="flex flex-col">
                  <div className="aspect-square overflow-hidden rounded-2xl border border-border opacity-80">
                    <CollectionArt collection={collection} />
                  </div>
                  <p className="pt-4 font-semibold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.note} · Not yet available</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {stories.length > 0 && (
        <section aria-labelledby="collection-journal" className="mt-24">
          <SectionHeading id="collection-journal" eyebrow="From Mika's journal" title="Stories from this collection" />
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((a) => (
              <JournalCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  return (
    <Suspense fallback={<div className="container-page animate-pulse py-14" aria-hidden><div className="mx-auto h-10 w-2/3 rounded bg-secondary" /><div className="mt-10 aspect-[16/9] rounded-2xl bg-secondary" /></div>}>
      <Content params={params} />
    </Suspense>
  );
}
