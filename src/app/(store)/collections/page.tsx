import type { Metadata } from "next";
import { CollectionBanner } from "@/components/collection/collection-banner";
import { getCollections } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Collections",
  description: "Explore MIKADAY collections, each built around an original illustration from Mika's world, starting with Mountain Sunset.",
  path: "/collections",
});

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="container-page py-12 lg:py-16">
      <header className="mb-12 max-w-2xl">
        <p className="text-eyebrow text-primary">Collections</p>
        <h1 className="mt-2 text-h1">Designed around a single idea</h1>
        <p className="mt-4 text-lead text-muted-foreground">
          Each collection starts with one original illustration and grows into a small set of everyday pieces.
        </p>
      </header>
      <div className="flex flex-col gap-10">
        {collections.map((c) => (
          <CollectionBanner key={c.slug} collection={c} />
        ))}
      </div>
    </div>
  );
}
