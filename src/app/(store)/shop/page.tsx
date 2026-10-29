import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { ProductFilters, ShopToolbar, type ShopFacets } from "@/components/product/product-filters";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { getPublishedProducts, type ProductSummary } from "@/lib/catalog";
import { getCollections } from "@/lib/content";
import { parseShopQuery, type ShopQuery } from "@/lib/shop-query";
import { PRICE_BANDS } from "@/lib/store-categories";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse original MIKADAY designs — drinkware, clothing, and everyday accessories inspired by Mika's world.",
};

function applyQuery(products: ProductSummary[], query: ShopQuery, collectionProductIds: Set<string> | null) {
  const q = query.q.toLowerCase();
  const filtered = products.filter((p) => {
    if (q && !`${p.title} ${p.type ?? ""} ${p.colors.map((c) => c.name).join(" ")}`.toLowerCase().includes(q)) return false;
    if (query.category.length && !query.category.includes(p.storeCategory)) return false;
    if (collectionProductIds && !collectionProductIds.has(p.id)) return false;
    if (query.price.length) {
      const bands = PRICE_BANDS.filter((b) => query.price.includes(b.slug));
      if (!bands.some((b) => p.minPrice >= b.min && p.minPrice < b.max)) return false;
    }
    if (query.color.length && !p.colors.some((c) => query.color.includes(c.name))) return false;
    return true;
  });
  if (query.sort === "price-asc") return [...filtered].sort((a, b) => a.minPrice - b.minPrice);
  if (query.sort === "price-desc") return [...filtered].sort((a, b) => b.minPrice - a.minPrice);
  return filtered; // featured order comes from the catalog
}

async function ShopResults({ searchParams }: Pick<PageProps<"/shop">, "searchParams">) {
  const query = parseShopQuery(await searchParams);
  const [products, collections] = await Promise.all([getPublishedProducts(), getCollections()]);

  const collection = query.collection ? collections.find((c) => c.slug === query.collection) : null;
  const results = applyQuery(products, query, collection ? new Set(collection.productIds) : null);

  const categoryCounts: Record<string, number> = {};
  for (const p of products) categoryCounts[p.storeCategory] = (categoryCounts[p.storeCategory] ?? 0) + 1;
  const colorCounts = new Map<string, { name: string; code: string | null; count: number }>();
  for (const p of products) {
    for (const c of p.colors) {
      const entry = colorCounts.get(c.name) ?? { ...c, count: 0 };
      entry.count += 1;
      colorCounts.set(c.name, entry);
    }
  }
  const facets: ShopFacets = {
    categoryCounts,
    collections: collections.map((c) => ({ slug: c.slug, name: c.name })),
    colors: [...colorCounts.values()].sort((a, b) => b.count - a.count).slice(0, 14).map(({ name, code }) => ({ name, code })),
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
      <ProductFilters query={query} facets={facets} />
      <div>
        <ShopToolbar query={query} facets={facets} total={results.length} />
        {results.length > 0 ? (
          <ProductGrid products={results} eagerCount={4} className="lg:grid-cols-3" />
        ) : (
          <EmptyState
            icon={SearchX}
            title="No products match these filters"
            action={
              <Button asChild variant="outline">
                <Link href="/shop">Clear filters</Link>
              </Button>
            }
          >
            Try removing a filter or searching for something broader, like “mug” or “black”.
          </EmptyState>
        )}
      </div>
    </div>
  );
}

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <div className="container-page py-12 lg:py-16">
      <header className="mb-10 max-w-2xl">
        <p className="text-eyebrow text-primary">Shop</p>
        <h1 className="mt-2 text-h1">Original pieces for everyday life</h1>
        <p className="mt-4 text-lead text-muted-foreground">
          Every item is printed to order. Prices are in USD; shipping is calculated for your address at checkout.
        </p>
      </header>
      <Suspense fallback={<ProductGridSkeleton count={8} />}>
        <ShopResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
