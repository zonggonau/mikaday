import Link from "next/link";
import { MountainSunsetArt } from "@/components/brand/mountain-sunset-art";
import { Button } from "@/components/ui/button";
import type { Collection } from "@/content/types";
import { cn } from "@/lib/utils";

export function CollectionArt({ collection, className }: { collection: Collection; className?: string }) {
  // One illustration today; switch on `collection.art` as more collections are added.
  return <MountainSunsetArt className={className} title={`${collection.name} collection illustration`} />;
}

/** Visually distinct collection feature with its original illustration. */
export function CollectionBanner({
  collection,
  headingLevel = "h2",
  showButton = true,
  className,
}: {
  collection: Collection;
  headingLevel?: "h1" | "h2";
  showButton?: boolean;
  className?: string;
}) {
  const Heading = headingLevel;
  return (
    <section className={cn("overflow-hidden rounded-2xl bg-[#242424] text-[#faf7f2]", className)} aria-labelledby={`collection-${collection.slug}`}>
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
        <div className="aspect-[16/10] lg:order-2 lg:aspect-auto lg:min-h-[420px]">
          <CollectionArt collection={collection} />
        </div>
        <div className="flex flex-col justify-center gap-5 p-8 sm:p-10 lg:p-14">
          <p className="text-eyebrow text-[#f3b07f]">{collection.name} collection</p>
          <Heading id={`collection-${collection.slug}`} className={headingLevel === "h1" ? "text-h1" : "text-h2"}>
            {collection.heading}
          </Heading>
          <p className="text-lead text-[#e6ddd2]">{collection.summary}</p>
          {showButton && (
            <div>
              <Button asChild size="lg" className="bg-[#faf7f2] text-[#242424] hover:bg-white">
                <Link href={`/collections/${collection.slug}`}>Explore {collection.name}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
