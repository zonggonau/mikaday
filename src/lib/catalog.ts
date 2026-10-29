import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "./db";
import { storeCategoryFor, type StoreCategorySlug } from "./store-categories";

/** Every storefront read is tagged so admin edits and Printful webhooks can invalidate it. */
export const PRODUCTS_TAG = "products";

export interface VariantView {
  id: string;
  name: string;
  size: string | null;
  color: string | null;
  colorCode: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  available: boolean;
}

export interface ProductSummary {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  /** Printful product type, e.g. "Mugs" or "T-shirts". */
  type: string | null;
  storeCategory: StoreCategorySlug;
  minPrice: number;
  maxPrice: number;
  currency: string;
  colors: { name: string; code: string | null }[];
  sizes: string[];
  /** More than one variant: the shopper has to choose options before adding to cart. */
  hasOptions: boolean;
  /** Set for single-variant products so they can be added to the cart straight from a card. */
  singleVariant: { id: string; price: number; label: string | null; imageUrl: string | null; available: boolean } | null;
  featured: boolean;
}

export interface ProductDetail extends ProductSummary {
  description: string | null;
  brand: string | null;
  catalogProductId: number | null;
  /** Unique mockups in variant order, with the variants that use each one. */
  images: { url: string; color: string | null; variantIds: string[] }[];
  variants: VariantView[];
}

const productInclude = {
  variants: { where: { enabled: true }, orderBy: { position: "asc" as const } },
};

type ProductRow = Awaited<ReturnType<typeof findPublished>>[number];

function findPublished(where: { slug?: string } = {}) {
  return db.product.findMany({
    where: { published: true, deletedAt: null, ...where },
    include: productInclude,
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

function unique<T>(values: (T | null)[]) {
  return [...new Set(values.filter((v): v is T => v !== null))];
}

function toVariantView(v: ProductRow["variants"][number]): VariantView {
  return {
    id: v.id.toString(),
    name: v.name,
    size: v.size,
    color: v.color,
    colorCode: v.colorCode,
    price: Number(v.retailPrice),
    currency: v.currency,
    imageUrl: v.imageUrl,
    available: v.availability === "active",
  };
}

function toSummary(p: ProductRow): ProductSummary {
  const prices = p.variants.map((v) => Number(v.retailPrice));
  const colors = new Map<string, string | null>();
  for (const v of p.variants) if (v.color && !colors.has(v.color)) colors.set(v.color, v.colorCode);
  const title = p.title || p.name;

  return {
    id: p.id.toString(),
    slug: p.slug,
    title,
    imageUrl: p.thumbnailUrl ?? p.variants[0]?.imageUrl ?? null,
    type: p.categoryName,
    storeCategory: storeCategoryFor(p.categoryName, title),
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    currency: p.variants[0]?.currency ?? "USD",
    colors: [...colors].map(([name, code]) => ({ name, code })),
    sizes: unique(p.variants.map((v) => v.size)),
    hasOptions: p.variants.length > 1,
    singleVariant:
      p.variants.length === 1
        ? {
            id: p.variants[0].id.toString(),
            price: Number(p.variants[0].retailPrice),
            label: [p.variants[0].color, p.variants[0].size].filter(Boolean).join(" / ") || null,
            imageUrl: p.variants[0].imageUrl,
            available: p.variants[0].availability === "active",
          }
        : null,
    featured: p.featured,
  };
}

export async function getPublishedProducts(): Promise<ProductSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_TAG);

  const products = await findPublished();
  return products.filter((p) => p.variants.length > 0).map(toSummary);
}

/** Published products in the order of `ids`; unknown or unpublished IDs are skipped. */
export async function getProductsByIds(ids: string[]) {
  const all = await getPublishedProducts();
  const byId = new Map(all.map((p) => [p.id, p]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_TAG);

  const [product] = await findPublished({ slug });
  if (!product || product.variants.length === 0) return null;

  const images = new Map<string, { url: string; color: string | null; variantIds: string[] }>();
  for (const v of product.variants) {
    if (!v.imageUrl) continue;
    const entry = images.get(v.imageUrl) ?? { url: v.imageUrl, color: v.color, variantIds: [] };
    entry.variantIds.push(v.id.toString());
    images.set(v.imageUrl, entry);
  }

  return {
    ...toSummary(product),
    description: product.description,
    brand: product.brand,
    catalogProductId: product.catalogProductId,
    images: [...images.values()],
    variants: product.variants.map(toVariantView),
  };
}
