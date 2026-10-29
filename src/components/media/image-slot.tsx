import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/content/types";

/**
 * Renders an approved image, or a clean labelled placeholder describing the intended shot.
 * Drop a file in /public and set `src` in src/content to replace a placeholder.
 */
export function ImageSlot({
  image,
  aspect = "4 / 5",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  className,
}: {
  image: ImageAsset;
  aspect?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (image.src) {
    return (
      <figure className={cn("relative overflow-hidden rounded-2xl bg-secondary", className)} style={{ aspectRatio: aspect }}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          className="object-cover"
        />
        {(image.kind === "illustration" || image.conceptual) && (
          <figcaption className="absolute bottom-3 left-3 rounded-md bg-card/90 px-2 py-1 text-xs font-medium text-foreground">
            {image.kind === "illustration" ? "Illustration" : "AI-generated lifestyle image"}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <div
      role="img"
      aria-label={image.alt}
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-border bg-secondary p-6 text-center",
        className,
      )}
      style={{ aspectRatio: aspect }}
    >
      <span className="grid size-12 place-items-center rounded-full bg-card text-muted-foreground" aria-hidden>
        <ImageIcon className="size-5" />
      </span>
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase" aria-hidden>
        Image placeholder
      </p>
      <p className="max-w-[28ch] text-sm text-muted-foreground" aria-hidden>
        {image.brief}
      </p>
    </div>
  );
}
