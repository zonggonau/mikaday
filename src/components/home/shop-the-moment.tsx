import Image from "next/image";
import Link from "next/link";
import { ImageSlot } from "@/components/media/image-slot";
import type { ImageAsset } from "@/content/types";
import type { ProductSummary } from "@/lib/catalog";
import { formatMoney } from "@/lib/format";

/** A lifestyle scene with plain, always-visible links to the products in it (no hover-only hotspots). */
export function ShopTheMoment({ title, text, image, products }: { title: string; text: string; image: ImageAsset; products: ProductSummary[] }) {
  return (
    <section aria-labelledby="shop-the-moment" className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
      <ImageSlot image={image} aspect="5 / 4" sizes="(min-width: 1024px) 640px, 100vw" />
      <div>
        <p className="text-eyebrow text-primary">In the scene</p>
        <h2 id="shop-the-moment" className="mt-2 text-h2">
          {title}
        </h2>
        <p className="mt-4 text-lead text-muted-foreground">{text}</p>
        {products.length > 0 ? (
          <ul className="mt-8 flex flex-col gap-3">
            {products.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/shop/${p.slug}`}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-input"
                >
                  <span className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
                    {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="80px" className="object-contain p-1.5" />}
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold">{p.title}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {p.minPrice !== p.maxPrice ? "From " : ""}
                      {formatMoney(p.minPrice, p.currency)}
                    </span>
                  </span>
                  <span className="pr-2 text-sm font-semibold text-primary" aria-hidden>
                    View →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 text-sm text-muted-foreground">The pieces in this scene are coming to the shop soon.</p>
        )}
      </div>
    </section>
  );
}
