"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { selectClass } from "@/components/shipping-estimator";
import { EMPTY_QUERY, hasFilters, shopHref, SORT_OPTIONS, toggle, type ShopQuery } from "@/lib/shop-query";
import { PRICE_BANDS, STORE_CATEGORIES } from "@/lib/store-categories";
import { cn } from "@/lib/utils";

export interface ShopFacets {
  categoryCounts: Record<string, number>;
  collections: { slug: string; name: string }[];
  colors: { name: string; code: string | null }[];
}

function useShopNavigation() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = (next: ShopQuery) => startTransition(() => router.replace(shopHref(next), { scroll: false }));
  return { go, pending };
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-border pb-6">
      <legend className="mb-3 text-sm font-semibold">{title}</legend>
      <div className="flex flex-col gap-1">{children}</div>
    </fieldset>
  );
}

function CheckRow({ id, label, checked, onChange, count }: { id: string; label: string; checked: boolean; onChange: () => void; count?: number }) {
  return (
    <div className="flex min-h-11 items-center gap-3">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="flex-1 cursor-pointer text-sm font-normal">
        {label}
      </Label>
      {count !== undefined && <span className="text-xs text-muted-foreground tabular-nums">{count}</span>}
    </div>
  );
}

function FilterControls({ query, facets, idPrefix }: { query: ShopQuery; facets: ShopFacets; idPrefix: string }) {
  const { go } = useShopNavigation();
  const [q, setQ] = useState(query.q);

  function search(event: FormEvent) {
    event.preventDefault();
    go({ ...query, q: q.trim() });
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={search} role="search" className="flex flex-col gap-2 border-b border-border pb-6">
        <Label htmlFor={`${idPrefix}-q`} className="text-sm font-semibold">
          Search
        </Label>
        <div className="flex gap-2">
          <Input id={`${idPrefix}-q`} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Product name" />
          <Button type="submit" variant="outline">
            Go
          </Button>
        </div>
      </form>

      <FilterGroup title="Category">
        {STORE_CATEGORIES.map((c) => (
          <CheckRow
            key={c.slug}
            id={`${idPrefix}-cat-${c.slug}`}
            label={c.name}
            count={facets.categoryCounts[c.slug] ?? 0}
            checked={query.category.includes(c.slug)}
            onChange={() => go({ ...query, category: toggle(query.category, c.slug) })}
          />
        ))}
      </FilterGroup>

      {facets.collections.length > 0 && (
        <FilterGroup title="Collection">
          {facets.collections.map((c) => (
            <CheckRow
              key={c.slug}
              id={`${idPrefix}-col-${c.slug}`}
              label={c.name}
              checked={query.collection === c.slug}
              onChange={() => go({ ...query, collection: query.collection === c.slug ? null : c.slug })}
            />
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="Price">
        {PRICE_BANDS.map((b) => (
          <CheckRow
            key={b.slug}
            id={`${idPrefix}-price-${b.slug}`}
            label={b.label}
            checked={query.price.includes(b.slug)}
            onChange={() => go({ ...query, price: toggle(query.price, b.slug) })}
          />
        ))}
      </FilterGroup>

      {facets.colors.length > 0 && (
        <fieldset className="pb-2">
          <legend className="mb-3 text-sm font-semibold">Color</legend>
          <div className="flex flex-wrap gap-1.5">
            {facets.colors.map((c) => {
              const selected = query.color.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => go({ ...query, color: toggle(query.color, c.name) })}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
                    selected ? "border-foreground bg-card font-semibold" : "border-border bg-card hover:border-input",
                  )}
                >
                  <span className="size-4 rounded-full border border-black/15" style={{ backgroundColor: c.code ?? "#d4ccc2" }} aria-hidden />
                  {c.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
}

/** Desktop sidebar. */
export function ProductFilters({ query, facets }: { query: ShopQuery; facets: ShopFacets }) {
  return (
    <aside aria-label="Product filters" className="hidden lg:block">
      <FilterControls key={shopHref(query)} query={query} facets={facets} idPrefix="desktop" />
    </aside>
  );
}

/** Count, sort, active filters and the mobile filter drawer. */
export function ShopToolbar({ query, facets, total }: { query: ShopQuery; facets: ShopFacets; total: number }) {
  const { go, pending } = useShopNavigation();
  const filtered = hasFilters(query);
  const chips = [
    ...(query.q ? [{ label: `“${query.q}”`, next: { ...query, q: "" } }] : []),
    ...query.category.map((c) => ({ label: STORE_CATEGORIES.find((x) => x.slug === c)?.name ?? c, next: { ...query, category: toggle(query.category, c) } })),
    ...(query.collection
      ? [{ label: facets.collections.find((c) => c.slug === query.collection)?.name ?? query.collection, next: { ...query, collection: null } }]
      : []),
    ...query.price.map((p) => ({ label: PRICE_BANDS.find((b) => b.slug === p)?.label ?? p, next: { ...query, price: toggle(query.price, p) } })),
    ...query.color.map((c) => ({ label: c, next: { ...query, color: toggle(query.color, c) } })),
  ];

  return (
    <div className="mb-8 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="lg:hidden">
              <SlidersHorizontal /> Filters{chips.length > 0 && ` (${chips.length})`}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="gap-0 bg-background p-0 data-[side=left]:w-[min(90vw,22rem)]">
            <SheetHeader className="border-b border-border px-5 py-4">
              <SheetTitle className="font-serif text-xl font-medium">Filters</SheetTitle>
              <SheetDescription>{total} {total === 1 ? "product" : "products"}</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <FilterControls key={shopHref(query)} query={query} facets={facets} idPrefix="mobile" />
            </div>
            {filtered && (
              <SheetFooter className="border-t border-border px-5 py-4">
                <Button variant="outline" onClick={() => go({ ...EMPTY_QUERY, sort: query.sort })}>
                  Clear filters
                </Button>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          {pending ? "Updating…" : `${total} ${total === 1 ? "product" : "products"}`}
        </p>

        <div className="ml-auto flex items-center gap-2">
          <Label htmlFor="shop-sort" className="text-sm whitespace-nowrap text-muted-foreground">
            Sort by
          </Label>
          <select
            id="shop-sort"
            className={cn(selectClass, "w-auto")}
            value={query.sort}
            onChange={(e) => go({ ...query, sort: e.target.value as ShopQuery["sort"] })}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {chips.length > 0 && (
        <ul className="flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map((chip) => (
            <li key={chip.label}>
              <Button variant="secondary" size="sm" onClick={() => go(chip.next)} aria-label={`Remove filter ${chip.label}`}>
                {chip.label} <X className="size-3.5" />
              </Button>
            </li>
          ))}
          <li>
            <Button variant="link" size="sm" onClick={() => go({ ...EMPTY_QUERY, sort: query.sort })}>
              Clear filters
            </Button>
          </li>
        </ul>
      )}
    </div>
  );
}
