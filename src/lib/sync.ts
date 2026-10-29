import "server-only";
import { db } from "./db";
import { productSlug } from "./format";
import {
  printful,
  PrintfulError,
  type PfCatalogProduct,
  type PfSyncProduct,
  type PfSyncVariant,
} from "./printful";

let categoryCache: { fetchedAt: number; titles: Map<number, string> } | null = null;

async function categoryTitles() {
  if (categoryCache && Date.now() - categoryCache.fetchedAt < 6 * 60 * 60 * 1000) {
    return categoryCache.titles;
  }
  const categories = await printful.getCategories();
  categoryCache = { fetchedAt: Date.now(), titles: new Map(categories.map((c) => [c.id, c.title])) };
  return categoryCache.titles;
}

/** The "preview" file is the generated mockup; fall back to the blank catalog image. */
function variantImage(variant: PfSyncVariant) {
  return variant.files.find((f) => f.type === "preview")?.preview_url ?? variant.product.image;
}

function upsertSummary(p: PfSyncProduct) {
  const id = BigInt(p.id);
  const shared = {
    name: p.name,
    externalId: p.external_id,
    thumbnailUrl: p.thumbnail_url,
    variantCount: p.synced,
    deletedAt: null,
  };
  // New products arrive unpublished so only products chosen in the admin panel are sold.
  return db.product.upsert({
    where: { id },
    create: { id, slug: productSlug(p.name, id), ...shared },
    update: shared,
  });
}

/**
 * Called for product_synced / product_updated webhooks. Products already set up for
 * sale get a full refresh; others only get their name and thumbnail updated.
 */
export async function syncProductFromWebhook(p: PfSyncProduct) {
  const current = await db.product.findUnique({
    where: { id: BigInt(p.id) },
    select: { published: true, detailsSyncedAt: true },
  });
  if (current?.published || current?.detailsSyncedAt) return syncProductDetails(p.id);
  await upsertSummary(p);
  return { deleted: false as const, variants: 0 };
}

/** Imports the list of sync products (name, thumbnail, variant count) — 1–2 API calls. */
export async function syncProductList() {
  const remote = (await printful.listSyncProducts()).filter((p) => !p.is_ignored);
  const ids = remote.map((p) => BigInt(p.id));
  const existing = new Set(
    (await db.product.findMany({ where: { id: { in: ids } }, select: { id: true } })).map((p) => p.id),
  );

  await db.$transaction(remote.map(upsertSummary));

  const removed = await db.product.updateMany({
    where: { id: { notIn: ids }, deletedAt: null },
    data: { deletedAt: new Date(), published: false },
  });

  return {
    total: remote.length,
    created: ids.filter((id) => !existing.has(id)).length,
    removed: removed.count,
  };
}

/** Pulls variants, prices, mockups, colors and description for one product. */
export async function syncProductDetails(id: bigint | number | string) {
  const productId = BigInt(id);

  let remote;
  try {
    remote = await printful.getSyncProduct(String(productId));
  } catch (error) {
    if (error instanceof PrintfulError && error.status === 404) {
      await db.product.updateMany({
        where: { id: productId },
        data: { deletedAt: new Date(), published: false },
      });
      return { deleted: true as const, variants: 0 };
    }
    throw error;
  }

  const { sync_product: product, sync_variants } = remote;
  const variants = sync_variants.filter((v) => v.synced && !v.is_ignored);

  const catalogs = new Map<number, PfCatalogProduct>();
  for (const catalogId of new Set(variants.map((v) => v.product.product_id))) {
    try {
      catalogs.set(catalogId, await printful.getCatalogProduct(catalogId));
    } catch {
      // Catalog data only adds description/color codes; the variant data is enough to sell.
    }
  }

  const primary = variants[0] ? catalogs.get(variants[0].product.product_id) : undefined;
  const categoryId = variants[0]?.main_category_id ?? primary?.product.main_category_id ?? null;
  const categoryName = categoryId
    ? ((await categoryTitles().catch(() => null))?.get(categoryId) ?? null)
    : null;

  const current = await db.product.findUnique({
    where: { id: productId },
    select: { description: true },
  });

  const productData = {
    name: product.name,
    externalId: product.external_id,
    thumbnailUrl: product.thumbnail_url,
    variantCount: variants.length,
    catalogProductId: primary?.product.id ?? null,
    brand: primary?.product.brand ?? null,
    categoryId,
    categoryName,
    deletedAt: null,
    detailsSyncedAt: new Date(),
  };
  const catalogDescription = primary?.product.description ?? null;

  await db.$transaction(
    async (tx) => {
      await tx.product.upsert({
        where: { id: productId },
        create: {
          id: productId,
          slug: productSlug(product.name, productId),
          description: catalogDescription,
          ...productData,
        },
        // Never overwrite a description the admin has written.
        update: current?.description ? productData : { ...productData, description: catalogDescription },
      });

      await tx.variant.deleteMany({
        where: { productId, id: { notIn: variants.map((v) => BigInt(v.id)) } },
      });

      for (const [position, v] of variants.entries()) {
        const catalogVariant = catalogs
          .get(v.product.product_id)
          ?.variants.find((cv) => cv.id === v.variant_id);
        const data = {
          productId,
          catalogVariantId: v.variant_id,
          name: v.name,
          size: v.size ?? catalogVariant?.size ?? null,
          color: v.color ?? catalogVariant?.color ?? null,
          colorCode: catalogVariant?.color_code ?? null,
          sku: v.sku,
          retailPrice: v.retail_price,
          cost: catalogVariant?.price ?? null,
          currency: v.currency,
          imageUrl: variantImage(v),
          availability: v.availability_status,
          position,
        };
        // `enabled` is an admin choice, so it is only set on create.
        await tx.variant.upsert({
          where: { id: BigInt(v.id) },
          create: { id: BigInt(v.id), ...data },
          update: data,
        });
      }
    },
    { timeout: 30_000 },
  );

  return { deleted: false as const, variants: variants.length };
}

/** Refreshes details for every product that is (or was) set up for sale. */
export async function syncPublishedProductDetails() {
  const products = await db.product.findMany({
    where: { deletedAt: null, OR: [{ published: true }, { detailsSyncedAt: { not: null } }] },
    select: { id: true, name: true },
  });
  const failed: string[] = [];
  for (const product of products) {
    try {
      await syncProductDetails(product.id);
    } catch (error) {
      console.error(`[sync] product ${product.id} failed`, error);
      failed.push(product.name);
    }
  }
  return { synced: products.length - failed.length, failed };
}
