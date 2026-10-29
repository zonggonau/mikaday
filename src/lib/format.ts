export function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function formatPriceRange(min: number, max: number, currency: string) {
  return min === max
    ? formatMoney(min, currency)
    : `${formatMoney(min, currency)} – ${formatMoney(max, currency)}`;
}

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Printful product names often repeat, so the ID keeps every slug unique and stable. */
export function productSlug(name: string, id: bigint | number | string) {
  const base = slugify(name) || "product";
  return `${base}-${id}`;
}

/** UTC so a date-only value like "2026-10-26" shows the same day on every server and browser. */
export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(date));
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(date),
  );
}
