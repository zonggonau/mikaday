import type { MetadataRoute } from "next";
import { getPublishedProducts } from "@/lib/catalog";
import { getArticles, getCollections } from "@/lib/content";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, articles, collections] = await Promise.all([getPublishedProducts(), getArticles(), getCollections()]);
  const page = (path: string) => ({ url: `${site.url}${path}` });

  return [
    ...["", "/meet-mika", "/shop", "/collections", "/journal", "/faq", "/shipping", "/returns", "/contact", "/privacy", "/terms"].map(page),
    ...collections.map((c) => page(`/collections/${c.slug}`)),
    ...articles.map((a) => ({ ...page(`/journal/${a.slug}`), lastModified: a.publishedAt })),
    ...products.map((p) => page(`/shop/${p.slug}`)),
  ];
}
