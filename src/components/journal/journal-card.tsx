import Link from "next/link";
import { ImageSlot } from "@/components/media/image-slot";
import type { JournalArticle } from "@/content/types";
import { formatDate } from "@/lib/format";

export function JournalCard({ article, headingLevel = "h3" }: { article: JournalArticle; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <article className="group flex flex-col">
      <Link href={`/journal/${article.slug}`} tabIndex={-1} aria-hidden className="block">
        <ImageSlot image={article.cover} aspect="4 / 3" sizes="(min-width: 1024px) 380px, (min-width: 768px) 50vw, 100vw" />
      </Link>
      <div className="flex flex-1 flex-col pt-5">
        <p className="text-eyebrow text-primary">{article.category}</p>
        <Heading className="mt-2 text-h3">
          <Link href={`/journal/${article.slug}`} className="hover:text-primary">
            {article.title}
          </Link>
        </Heading>
        <p className="mt-2 text-muted-foreground">{article.excerpt}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
        </p>
      </div>
    </article>
  );
}
