"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { QuantityStepper } from "@/components/cart/cart-lines";
import { ShippingEstimator } from "@/components/shipping-estimator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { ProductDetail } from "@/lib/catalog";
import { cart } from "@/lib/cart-store";
import { formatMoney } from "@/lib/format";
import { trackEvent } from "@/lib/gtag";
import type { SizeGuide } from "@/lib/size-guide";
import { cn } from "@/lib/utils";
import { SizeGuideDialog } from "./size-guide-dialog";

type GalleryImage = ProductDetail["images"][number] & { label: string };

function ProductGallery({
  images,
  activeUrl,
  title,
  onSelect,
}: {
  images: GalleryImage[];
  activeUrl: string | null;
  title: string;
  onSelect: (image: GalleryImage) => void;
}) {
  const active = images.find((i) => i.url === activeUrl) ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-card">
        {active && (
          <Image
            key={active.url}
            src={active.url}
            alt={`${title}${active.label ? ` — ${active.label}` : ""} — product mockup`}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-contain p-6"
          />
        )}
      </div>
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Product images">
          {images.map((img) => {
            const selected = img.url === active?.url;
            return (
              <li key={img.url} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onSelect(img)}
                  aria-label={`Show ${img.label || "image"}`}
                  aria-pressed={selected}
                  className={cn(
                    "relative block size-20 overflow-hidden rounded-xl border-2 bg-card",
                    selected ? "border-foreground" : "border-border hover:border-input",
                  )}
                >
                  <Image src={img.url} alt="" fill sizes="80px" className="object-contain p-1.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">Images are product mockups showing the design and print placement.</p>
    </div>
  );
}

export function ProductView({
  product,
  sizeGuide,
  details,
}: {
  product: ProductDetail;
  sizeGuide: SizeGuide | null;
  details?: ReactNode;
}) {
  const firstAvailable = product.variants.find((v) => v.available) ?? product.variants[0];
  const [color, setColor] = useState<string | null>(firstAvailable.color);
  // Shoppers must pick a size themselves when there is more than one.
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  // A thumbnail the shopper clicked; otherwise the selected variant's mockup is shown.
  const [pickedImage, setPickedImage] = useState<string | null>(null);

  const needsSize = product.sizes.length > 1;
  const forColor = product.variants.filter((v) => v.color === color);
  const variant = product.sizes.length === 0 ? forColor[0] : forColor.find((v) => v.size === size);
  const price = variant?.price ?? product.minPrice;

  const variantsById = new Map(product.variants.map((v) => [v.id, v]));
  const sizesOf = (image: ProductDetail["images"][number]) =>
    [...new Set(image.variantIds.map((id) => variantsById.get(id)?.size ?? null).filter(Boolean))] as string[];
  const gallery: GalleryImage[] = product.images.map((img) => {
    const sizes = sizesOf(img);
    // Name an image by size only when it belongs to one size (e.g. 11 oz vs 15 oz mug mockups).
    const label = [img.color, needsSize && sizes.length === 1 ? sizes[0] : null].filter(Boolean).join(" / ");
    return { ...img, label };
  });
  const activeUrl = pickedImage ?? variant?.imageUrl ?? forColor.find((v) => v.imageUrl)?.imageUrl ?? gallery[0]?.url ?? null;

  function chooseColor(next: string | null) {
    setColor(next);
    setPickedImage(null);
    setAdded(false);
  }

  function chooseSize(next: string) {
    setSize(next);
    setPickedImage(null);
    setAdded(false);
  }

  function chooseImage(image: GalleryImage) {
    setPickedImage(image.url);
    setColor(image.color);
    const sizes = sizesOf(image);
    if (sizes.length === 1) setSize(sizes[0]);
    setAdded(false);
  }

  function addToCart() {
    if (!variant || !variant.available) return;
    cart.add(
      {
        variantId: variant.id,
        name: product.title,
        variantLabel: [variant.color, variant.size].filter(Boolean).join(" / ") || null,
        price: variant.price,
        currency: variant.currency,
        imageUrl: variant.imageUrl ?? product.imageUrl,
        slug: product.slug,
      },
      quantity,
    );
    trackEvent("add_to_cart", {
      currency: variant.currency,
      value: variant.price * quantity,
      items: [{ item_id: variant.id, item_name: product.title, item_variant: variant.name, price: variant.price, quantity }],
    });
    setAdded(true);
    cart.open();
  }

  let cta = "Add to cart";
  if (needsSize && !size) cta = "Select a size";
  else if (!variant) cta = "Not available in this combination";
  else if (!variant.available) cta = "Currently unavailable";

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <ProductGallery images={gallery} activeUrl={activeUrl} title={product.title} onSelect={chooseImage} />
      </div>

      <div className="flex flex-col gap-7">
        <div>
          {product.type && <p className="text-eyebrow text-muted-foreground">{product.type}</p>}
          <h1 className="mt-2 text-h1">{product.title}</h1>
          <p className="mt-4 text-2xl font-semibold tabular-nums">
            {!variant && product.minPrice !== product.maxPrice && <span className="text-base font-normal text-muted-foreground">From </span>}
            {formatMoney(price, product.currency)}{" "}
            <span className="text-sm font-medium text-muted-foreground">{product.currency}</span>
          </p>
        </div>

        {product.colors.length > 0 && (
          <fieldset>
            <legend className="mb-3 text-sm font-semibold">
              Color: <span className="font-normal text-muted-foreground">{color}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => {
                const selected = c.name === color;
                const anyAvailable = product.variants.some((v) => v.color === c.name && v.available);
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => chooseColor(c.name)}
                    aria-pressed={selected}
                    aria-label={`${c.name}${anyAvailable ? "" : " (unavailable)"}`}
                    title={c.name}
                    className={cn(
                      "grid size-11 place-items-center rounded-full border-2 transition-colors",
                      selected ? "border-foreground" : "border-transparent hover:border-input",
                      !anyAvailable && "opacity-40",
                    )}
                  >
                    <span className="block size-8 rounded-full border border-black/15" style={{ backgroundColor: c.code ?? "#d4ccc2" }} />
                  </button>
                );
              })}
            </div>
            {product.colors.length === 1 && (
              <p className="mt-2 text-sm text-muted-foreground">Available in {product.colors[0].name} only.</p>
            )}
          </fieldset>
        )}

        {product.sizes.length > 0 && (
          <fieldset>
            <div className="mb-3 flex items-center justify-between gap-4">
              <legend className="text-sm font-semibold">
                Size{size && <span className="font-normal text-muted-foreground">: {size}</span>}
              </legend>
              {sizeGuide && <SizeGuideDialog guide={sizeGuide} productName={product.title} />}
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const option = forColor.find((v) => v.size === s);
                const available = Boolean(option?.available);
                const selected = s === size;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!available}
                    aria-pressed={selected}
                    aria-label={`${s}${available ? "" : " (unavailable in this color)"}`}
                    onClick={() => chooseSize(s)}
                    className={cn(
                      "h-11 min-w-14 rounded-lg border px-4 text-sm font-semibold transition-colors",
                      selected ? "border-foreground bg-foreground text-background" : "border-input bg-card hover:border-foreground",
                      !available && "cursor-not-allowed border-border text-muted-foreground line-through opacity-60",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <QuantityStepper value={quantity} onChange={setQuantity} label={product.title} />
          <Button size="lg" className="w-full sm:w-auto sm:flex-1" onClick={addToCart} disabled={!variant || !variant.available}>
            {cta === "Add to cart" ? `Add to cart · ${formatMoney(price * quantity, product.currency)}` : cta}
          </Button>
        </div>
        <p className="-mt-3 min-h-5 text-sm text-success" aria-live="polite">
          {added && (
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-4" /> Added to your cart
            </span>
          )}
        </p>

        <Accordion type="multiple" className="border-t border-border">
          <AccordionItem value="shipping">
            <AccordionTrigger className="py-4 text-base font-semibold">Estimate shipping</AccordionTrigger>
            <AccordionContent className="pb-5">
              <p className="mb-4 text-sm text-muted-foreground">
                Rates and delivery estimates come directly from our fulfillment provider for your destination.
              </p>
              <ShippingEstimator
                idPrefix="product-estimate"
                items={variant ? [{ variantId: variant.id, quantity }] : forColor[0] ? [{ variantId: forColor[0].id, quantity }] : []}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {details}
      </div>
    </div>
  );
}
