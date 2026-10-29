import type { Metadata } from "next";
import { CollectionBanner } from "@/components/collection/collection-banner";
import { getCollections } from "@/lib/content";

export const metadata: Metadata = {
  title: "Collections",
  description: "Original MIKADAY collections, each built around an illustration from Mika's world.",
};

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
