import { PRICE_BANDS, STORE_CATEGORIES, type PriceBandSlug, type StoreCategorySlug } from "./store-categories";

/** Shop filters live in the URL so results are shareable and work without JavaScript. */
export interface ShopQuery {
  q: string;
  category: StoreCategorySlug[];
  collection: string | null;
  price: PriceBandSlug[];
  color: string[];
  sort: "featured" | "price-asc" | "price-desc";
}

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
] as const;

const list = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value : value ? value.split(",") : []).map((v) => v.trim()).filter(Boolean);

export function parseShopQuery(params: Record<string, string | string[] | undefined>): ShopQuery {
  const categories = STORE_CATEGORIES.map((c) => c.slug as string);
  const bands = PRICE_BANDS.map((b) => b.slug as string);
  const sort = typeof params.sort === "string" ? params.sort : "";
  return {
    q: (typeof params.q === "string" ? params.q : "").trim().slice(0, 80),
    category: list(params.category).filter((c): c is StoreCategorySlug => categories.includes(c)),
    collection: typeof params.collection === "string" && params.collection ? params.collection : null,
    price: list(params.price).filter((p): p is PriceBandSlug => bands.includes(p)),
    color: list(params.color).slice(0, 20),
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? (sort as ShopQuery["sort"]) : "featured",
  };
}

export function shopHref(query: ShopQuery) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category.length) params.set("category", query.category.join(","));
  if (query.collection) params.set("collection", query.collection);
  if (query.price.length) params.set("price", query.price.join(","));
  if (query.color.length) params.set("color", query.color.join(","));
  if (query.sort !== "featured") params.set("sort", query.sort);
  const qs = params.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

export const EMPTY_QUERY: ShopQuery = { q: "", category: [], collection: null, price: [], color: [], sort: "featured" };

export function hasFilters(query: ShopQuery) {
  return Boolean(query.q || query.category.length || query.collection || query.price.length || query.color.length);
}

export function toggle<T>(values: T[], value: T) {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}
