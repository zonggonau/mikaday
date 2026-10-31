import type { Metadata } from "next";
import type { FaqItem, ImageAsset, JournalArticle } from "@/content/types";
import type { ProductDetail, ProductSummary } from "./catalog";
import { site } from "./site";

// Search and social metadata. Next merges metadata shallowly, so every page gets complete
// openGraph / twitter objects from pageMetadata() instead of relying on the root layout.

export const absoluteUrl = (path: string) => (/^https?:\/\//.test(path) ? path : `${site.url}${path}`);

interface OgImage {
  url: string;
  width?: number;
  height?: number;
  alt: string;
}

export const DEFAULT_OG_IMAGE: OgImage = {
  url: "/og/mikaday.jpg",
  width: 1200,
  height: 630,
  alt: `${site.name}: original designs inspired by Mika, an AI virtual creator`,
};

export const MEET_MIKA_OG_IMAGE: OgImage = {
  url: "/og/meet-mika.jpg",
  width: 1200,
  height: 630,
  alt: "Meet Mika, the AI virtual creator behind MIKADAY",
};

/** Landscape 1200×630 versions of the Mika photos (scripts/generate-og-images.cjs). */
const OG_CROPS = new Set(["mika-breakfast-mug.jpg", "mika-home-desk-mug.jpg", "mika-studio-mug.jpg", "mika-porch-mug.jpg"]);

/** Share image for an editorial image: its landscape crop, the upload itself, or the site card (SVG is not supported). */
export function ogImageFor(image: ImageAsset | undefined): OgImage {
  if (!image?.src || image.src.endsWith(".svg")) return DEFAULT_OG_IMAGE;
  const file = image.src.match(/^\/images\/mika\/([\w-]+\.jpg)$/)?.[1];
  if (file && OG_CROPS.has(file)) return { url: `/og/${file}`, width: 1200, height: 630, alt: image.alt };
  return { url: image.src, alt: image.alt };
}

export function pageMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  publishedTime,
  noindex = false,
}: {
  /** Page title; the layout appends " · MIKADAY". Use { absolute } for the home page. */
  title: string | { absolute: string };
  description: string;
  path: string;
  image?: OgImage;
  type?: "website" | "article";
  publishedTime?: string;
  noindex?: boolean;
}): Metadata {
  const fullTitle = typeof title === "string" ? `${title} · ${site.name}` : title.absolute;
  const images = [image];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      siteName: site.name,
      locale: "en_US",
      url: path,
      title: fullTitle,
      description,
      images,
      ...(type === "article" ? { type: "article", publishedTime, authors: [absoluteUrl("/meet-mika")] } : { type: "website" }),
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** Plain text for meta descriptions: whitespace collapsed, cut at a word near `length`. */
export function excerpt(text: string | null | undefined, length = 160) {
  if (!text) return site.description;
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= length) return flat;
  const cut = flat.slice(0, length - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > length * 0.6 ? cut.lastIndexOf(" ") : cut.length)}…`;
}

// ---------- Structured data (schema.org JSON-LD) — built from real store data only ----------

const ORG_ID = `${site.url}/#organization`;
const SITE_ID = `${site.url}/#website`;

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: site.name,
    url: site.url,
    logo: absoluteUrl("/brand/logo.png"),
    description: site.description,
    ...(site.social.length ? { sameAs: site.social.map((s) => s.url) } : {}),
    ...(site.supportEmail
      ? { contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: site.supportEmail, url: absoluteUrl("/contact") } }
      : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    name: site.name,
    url: site.url,
    description: site.description,
    inLanguage: "en",
    publisher: { "@id": ORG_ID },
  };
}

export function breadcrumbJsonLd(items: [name: string, path: string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: absoluteUrl(path) })),
  };
}

/** No ratings or reviews: the store has none, and invented ones are against Google's rules. */
export function productJsonLd(product: ProductDetail) {
  const url = absoluteUrl(`/shop/${product.slug}`);
  const inStock = product.variants.some((v) => v.available);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.title,
    url,
    image: product.images.map((i) => i.url),
    description: excerpt(product.description, 500),
    brand: { "@type": "Brand", name: site.name },
    ...(product.type ? { category: product.type } : {}),
    offers:
      product.variants.length > 1
        ? {
            "@type": "AggregateOffer",
            priceCurrency: product.currency,
            lowPrice: product.minPrice.toFixed(2),
            highPrice: product.maxPrice.toFixed(2),
            offerCount: product.variants.length,
            availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url,
          }
        : {
            "@type": "Offer",
            priceCurrency: product.currency,
            price: product.minPrice.toFixed(2),
            availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            url,
            seller: { "@id": ORG_ID },
          },
  };
}

export function productListJsonLd(name: string, path: string, products: ProductSummary[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: absoluteUrl(path),
    isPartOf: { "@id": SITE_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/shop/${p.slug}`),
        name: p.title,
      })),
    },
  };
}

export function articleJsonLd(article: JournalArticle) {
  const url = absoluteUrl(`/journal/${article.slug}`);
  const image = ogImageFor(article.cover);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: article.title,
    description: article.excerpt,
    url,
    mainEntityOfPage: url,
    datePublished: article.publishedAt,
    image: [absoluteUrl(image.url)],
    articleSection: article.category,
    inLanguage: "en",
    // Mika is a fictional AI character; the page says so next to the story.
    author: { "@type": "Person", name: "Mika", url: absoluteUrl("/meet-mika"), description: "AI virtual creator (fictional character) at MIKADAY" },
    publisher: { "@id": ORG_ID, "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: absoluteUrl("/brand/logo.png") } },
  };
}

export function blogJsonLd(articles: JournalArticle[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${site.name} Journal`,
    url: absoluteUrl("/journal"),
    publisher: { "@id": ORG_ID },
    blogPost: articles.map((a) => ({
      "@type": "BlogPosting",
      headline: a.title,
      url: absoluteUrl(`/journal/${a.slug}`),
      datePublished: a.publishedAt,
    })),
  };
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
