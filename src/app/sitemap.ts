import type { MetadataRoute } from "next";
import { getPublishedProducts } from "@/lib/catalog";
import { getArticles, getCollections, getHomeContent, getMikaProfile } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";
import { site } from "@/lib/site";

/** Raster images only: image sitemaps don't support SVG. */
const images = (...srcs: (string | null | undefined)[]) => {
  const list = srcs.filter((s): s is string => Boolean(s) && !s!.endsWith(".svg")).map(absoluteUrl);
  return list.length ? { images: list } : {};
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, articles, collections, { hero }, mika] = await Promise.all([
    getPublishedProducts(),
    getArticles(),
    getCollections(),
    getHomeContent(),
    getMikaProfile(),
  ]);
  const page = (path: string) => ({ url: `${site.url}${path}` });

  return [
    { ...page(""), ...images(hero.image.src) },
    { ...page("/meet-mika"), ...images(mika.portrait.src, mika.workspace.src) },
    ...["/shop", "/collections", "/journal", "/faq", "/shipping", "/returns", "/contact", "/privacy", "/terms"].map(page),
    ...collections.map((c) => page(`/collections/${c.slug}`)),
    ...articles.map((a) => ({ ...page(`/journal/${a.slug}`), lastModified: a.publishedAt, ...images(a.cover.src) })),
    ...products.map((p) => ({ ...page(`/shop/${p.slug}`), ...images(p.imageUrl) })),
  ];
}
