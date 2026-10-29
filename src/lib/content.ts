import "server-only";
import { collections } from "@/content/collections";
import { faq } from "@/content/faq";
import { hero, shopTheMoment } from "@/content/home";
import { mika } from "@/content/mika";
import { policies } from "@/content/policies";
import type { PolicyPage } from "@/content/types";
import { getPublishedArticle, getPublishedArticles } from "./journal";

/**
 * Content adapter. Pages only read editorial content through these functions, so the
 * file-based data can be replaced by a CMS (e.g. SaCMS) without touching the UI.
 */

export async function getMikaProfile() {
  return mika;
}

export async function getHomeContent() {
  return { hero, shopTheMoment };
}

export async function getCollections() {
  return collections;
}

export async function getCollection(slug: string) {
  return collections.find((c) => c.slug === slug) ?? null;
}

export async function getCollectionsForProduct(productId: string) {
  return collections.filter((c) => c.productIds.includes(productId));
}

/** Journal articles live in the database and are managed in Admin → Jurnal. */
export async function getArticles() {
  return getPublishedArticles();
}

export async function getArticle(slug: string) {
  return getPublishedArticle(slug);
}

export async function getArticlesForProduct(productId: string) {
  return (await getPublishedArticles()).filter((a) => a.productIds.includes(productId));
}

export async function getFaq() {
  return faq;
}

export async function getPolicy(slug: PolicyPage["slug"]) {
  return policies.find((p) => p.slug === slug) ?? null;
}
