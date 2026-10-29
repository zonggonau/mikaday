/** Storefront categories. Printful catalog categories are mapped onto these three groups. */
export const STORE_CATEGORIES = [
  { slug: "drinkware", name: "Drinkware" },
  { slug: "clothing", name: "Clothing" },
  { slug: "bags-accessories", name: "Bags & Accessories" },
] as const;

export type StoreCategorySlug = (typeof STORE_CATEGORIES)[number]["slug"];

const DRINKWARE = /\b(mugs?|tumblers?|bottles?|glass(es|ware)?|cups?|drinkware|steins?)\b/i;
const ACCESSORIES =
  /\b(totes?|bags?|backpacks?|fanny|hats?|caps?|beanies?|visors?|phone cases?|cases?|stickers?|pins?|socks?|accessor(y|ies)|wallets?|pouch(es)?|bandanas?|keychains?)\b/i;

export function storeCategoryFor(printfulCategory: string | null, productName: string): StoreCategorySlug {
  const text = `${printfulCategory ?? ""} ${productName}`;
  if (DRINKWARE.test(printfulCategory ?? "") || (!printfulCategory && DRINKWARE.test(productName))) return "drinkware";
  if (ACCESSORIES.test(printfulCategory ?? "") || (!printfulCategory && ACCESSORIES.test(productName))) return "bags-accessories";
  if (DRINKWARE.test(text)) return "drinkware";
  return "clothing";
}

export function storeCategoryName(slug: StoreCategorySlug) {
  return STORE_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

/** Price bands for the shop filter (store currency). */
export const PRICE_BANDS = [
  { slug: "under-25", label: "Under $25", min: 0, max: 25 },
  { slug: "25-50", label: "$25 – $50", min: 25, max: 50 },
  { slug: "over-50", label: "Over $50", min: 50, max: Number.POSITIVE_INFINITY },
] as const;

export type PriceBandSlug = (typeof PRICE_BANDS)[number]["slug"];
