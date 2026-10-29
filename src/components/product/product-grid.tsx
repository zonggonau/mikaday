import type { ProductSummary } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";

/** 1 column on very narrow screens, 2 when space permits, 3 on tablet, 4 on desktop. */
export const productGridClass = "grid grid-cols-1 gap-x-5 gap-y-10 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

export function ProductGrid({ products, eagerCount = 0, className }: { products: ProductSummary[]; eagerCount?: number; className?: string }) {
  return (
    <div className={cn(productGridClass, className)}>
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} eager={index < eagerCount} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={productGridClass} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square rounded-2xl bg-secondary" />
          <div className="mt-4 h-4 w-3/4 rounded bg-secondary" />
          <div className="mt-2 h-4 w-1/4 rounded bg-secondary" />
          <div className="mt-4 h-11 rounded-lg bg-secondary" />
        </div>
      ))}
    </div>
  );
}
