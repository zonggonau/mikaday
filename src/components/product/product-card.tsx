import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ProductSummary } from "@/lib/catalog";
import { formatMoney } from "@/lib/format";
import { QuickAddButton } from "./quick-add-button";

function optionSummary(p: ProductSummary) {
  const parts: string[] = [];
  if (p.colors.length > 1) parts.push(`${p.colors.length} colors`);
  else if (p.colors.length === 1) parts.push(p.colors[0].name);
  if (p.sizes.length > 1) parts.push(`${p.sizes.length} sizes`);
  else if (p.sizes.length === 1) parts.push(p.sizes[0]);
  return parts.join(" · ");
}

export function ProductCard({ product, eager = false }: { product: ProductSummary; eager?: boolean }) {
  const href = `/shop/${product.slug}`;
  const options = optionSummary(product);

  return (
    <article className="group flex h-full flex-col">
      <Link href={href} className="block overflow-hidden rounded-2xl border border-border bg-card" tabIndex={-1} aria-hidden>
        <div className="relative aspect-square">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt=""
              fill
              loading={eager ? "eager" : "lazy"}
              sizes="(min-width: 1024px) 270px, (min-width: 768px) 33vw, (min-width: 480px) 50vw, 100vw"
              className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">No image</div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1 pt-4">
        <h3 className="text-base leading-snug font-semibold">
          <Link href={href} className="-my-3 block py-3 hover:text-primary">
            {product.title}
          </Link>
        </h3>
        <p className="font-semibold tabular-nums">
          {product.minPrice !== product.maxPrice && <span className="font-normal text-muted-foreground">From </span>}
          {formatMoney(product.minPrice, product.currency)}
        </p>
        {options && <p className="text-sm text-muted-foreground">{options}</p>}
        {product.colors.length > 1 && (
          <ul className="flex flex-wrap items-center gap-1.5 pt-1" aria-label="Available colors">
            {product.colors.slice(0, 6).map((c) => (
              <li key={c.name}>
                <span className="block size-4 rounded-full border border-black/15" style={{ backgroundColor: c.code ?? "#d4ccc2" }} title={c.name} />
                <span className="sr-only">{c.name}</span>
              </li>
            ))}
            {product.colors.length > 6 && <li className="text-xs text-muted-foreground">+{product.colors.length - 6}</li>}
          </ul>
        )}
        <div className="mt-auto pt-4">
          {product.hasOptions ? (
            <Button asChild variant="outline" className="w-full">
              <Link href={href}>
                Choose options<span className="sr-only"> for {product.title}</span>
              </Link>
            </Button>
          ) : (
            <QuickAddButton product={product} />
          )}
        </div>
      </div>
    </article>
  );
}
