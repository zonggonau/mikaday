import { ArrowUpRight } from "lucide-react";
import { site } from "@/lib/site";

/** Renders only the social accounts configured in the environment — nothing is invented. */
export function FollowMika() {
  if (site.social.length === 0) return null;

  return (
    <section aria-labelledby="follow-mika" className="rounded-2xl border border-border bg-card px-6 py-10 text-center sm:px-10">
      <p className="text-eyebrow text-primary">Daily stories</p>
      <h2 id="follow-mika" className="mt-2 text-h2">
        Follow Mika
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
        Short videos from Mika&apos;s everyday — slow mornings, sketches, and the pieces that show up along the way.
      </p>
      <ul className="mt-8 flex flex-wrap justify-center gap-3">
        {site.social.map((s) => (
          <li key={s.name}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-input bg-background px-5 text-sm font-semibold hover:border-foreground"
            >
              {s.name} <ArrowUpRight className="size-4" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
