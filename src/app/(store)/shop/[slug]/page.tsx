import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SectionHeading } from "@/components/empty-state";
import { JournalCard } from "@/components/journal/journal-card";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductView } from "@/components/product/product-view";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { JsonLd } from "@/components/seo/json-ld";
import { getProductBySlug, getPublishedProducts, type ProductDetail } from "@/lib/catalog";
import { getArticlesForProduct, getCollectionsForProduct } from "@/lib/content";
import { breadcrumbJsonLd, excerpt, pageMetadata, productJsonLd } from "@/lib/seo";
import { getSizeGuide } from "@/lib/size-guide";

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found", robots: { index: false } };
  return pageMetadata({
    title: product.title,
    description: excerpt(product.description),
    path: `/shop/${product.slug}`,
    image: product.imageUrl ? { url: product.imageUrl, alt: product.title } : undefined,
  });
}

/** Structured data from verified store data only: name, image, price, availability. */
function ProductJsonLd({ product }: { product: ProductDetail }) {
  return (
    <JsonLd
      data={[
        productJsonLd(product),
        breadcrumbJsonLd([
          ["Home", "/"],
          ["Shop", "/shop"],
          [product.title, `/shop/${product.slug}`],
        ]),
      ]}
    />
  );
}

async function ProductContent({ params }: Pick<PageProps<"/shop/[slug]">, "params">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [sizeGuide, collections, articles, all] = await Promise.all([
    product.catalogProductId && product.sizes.length > 1 ? getSizeGuide(product.catalogProductId) : null,
    getCollectionsForProduct(product.id),
    getArticlesForProduct(product.id),
    getPublishedProducts(),
  ]);
  const related = all.filter((p) => p.id !== product.id && p.storeCategory === product.storeCategory).slice(0, 4);
  const collection = collections[0];

  const details = (
    <Accordion type="multiple" defaultValue={["details"]} className="-mt-7 border-y border-border">
      {product.description && (
        <AccordionItem value="details">
          <AccordionTrigger className="py-4 text-base font-semibold">Product details</AccordionTrigger>
          <AccordionContent className="pb-5">
            <p className="prose-description leading-relaxed text-muted-foreground">{product.description}</p>
            <p className="mt-4 text-xs text-muted-foreground">Specifications provided by our fulfillment provider for this product model.</p>
          </AccordionContent>
        </AccordionItem>
      )}
      <AccordionItem value="shipping-returns">
        <AccordionTrigger className="py-4 text-base font-semibold">Shipping & returns</AccordionTrigger>
        <AccordionContent className="pb-5 leading-relaxed text-muted-foreground">
          <p>
            Made to order and shipped by our fulfillment provider. Shipping options and costs for your address are shown before you pay. International
            orders may be subject to import duties.
          </p>
          <p>
            See <Link href="/shipping">Shipping</Link> and <Link href="/returns">Returns</Link> for details.
          </p>
        </AccordionContent>
      </AccordionItem>
      {collection && (
        <AccordionItem value="collection">
          <AccordionTrigger className="py-4 text-base font-semibold">The {collection.name} story</AccordionTrigger>
          <AccordionContent className="pb-5 leading-relaxed text-muted-foreground">
            <p>{collection.story[0]}</p>
            <p>
              <Link href={`/collections/${collection.slug}`}>Explore the {collection.name} collection</Link>
            </p>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/shop" className="hover:text-foreground">
              Shop
            </Link>
          </li>
          {collection && (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link href={`/collections/${collection.slug}`} className="hover:text-foreground">
                  {collection.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-foreground">
            {product.title}
          </li>
        </ol>
      </nav>

      <ProductView key={product.id} product={product} sizeGuide={sizeGuide} details={details} />
      <ProductJsonLd product={product} />

      {articles.length > 0 && (
        <section aria-labelledby="seen-in-journal" className="mt-24">
          <SectionHeading id="seen-in-journal" eyebrow="Seen in Mika's journal" title="Stories with this piece" />
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            {articles.slice(0, 3).map((a) => (
              <JournalCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-24">
          <SectionHeading id="related" eyebrow="You may also like" title="More for your everyday" />
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-1 animate-pulse gap-10 lg:grid-cols-2" aria-hidden>
      <div className="aspect-square rounded-2xl bg-secondary" />
      <div className="space-y-4">
        <div className="h-4 w-24 rounded bg-secondary" />
        <div className="h-10 w-3/4 rounded bg-secondary" />
        <div className="h-7 w-28 rounded bg-secondary" />
        <div className="h-24 rounded-2xl bg-secondary" />
        <div className="h-12 rounded-lg bg-secondary" />
      </div>
    </div>
  );
}

export default function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  return (
    <div className="container-page py-8 lg:py-12">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductContent params={params} />
      </Suspense>
    </div>
  );
}
