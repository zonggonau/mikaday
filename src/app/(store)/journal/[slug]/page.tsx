import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AiBadge } from "@/components/brand/ai-badge";
import { SectionHeading } from "@/components/empty-state";
import { JournalCard } from "@/components/journal/journal-card";
import { ImageSlot } from "@/components/media/image-slot";
import { ProductGrid } from "@/components/product/product-grid";
import { getProductsByIds } from "@/lib/catalog";
import { getArticle, getArticles, getMikaProfile } from "@/lib/content";
import { formatDate } from "@/lib/format";

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const article = await getArticle((await params).slug);
  if (!article) return { title: "Story not found" };
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: { type: "article", title: article.title, description: article.excerpt, publishedTime: article.publishedAt },
  };
}

async function Content({ params }: Pick<PageProps<"/journal/[slug]">, "params">) {
  const article = await getArticle((await params).slug);
  if (!article) notFound();

  const [products, articles, mika] = await Promise.all([getProductsByIds(article.productIds), getArticles(), getMikaProfile()]);
  const more = articles.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <div className="container-page py-10 lg:py-14">
      <article>
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-eyebrow text-primary">
            <Link href="/journal" className="hover:underline">
              Journal
            </Link>{" "}
            · {article.category}
          </p>
          <h1 className="mt-3 text-h1 text-balance">{article.title}</h1>
          <p className="mt-4 text-lead text-muted-foreground">{article.excerpt}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            By Mika · <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          </p>
        </header>

        <ImageSlot image={article.cover} aspect="16 / 9" priority sizes="(min-width: 1200px) 1136px, 100vw" className="mt-10" />

        <div className="mx-auto mt-12 max-w-[68ch]">
          <aside className="mb-10 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
            <AiBadge className="self-start" />
            <p className="text-sm text-muted-foreground">
              This is a fictional story written in the voice of {mika.name}. The products mentioned are real items you can buy at MIKADAY.
            </p>
          </aside>

          <div className="prose-mika text-lg leading-[1.75]">
            {article.body.map((block, i) =>
              block.type === "h2" ? <h2 key={i}>{block.text}</h2> : <p key={i}>{block.text}</p>,
            )}
          </div>

          {article.video && (
            <a
              href={article.video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-5 text-sm font-semibold hover:border-foreground"
            >
              Watch this story on {article.video.platform} <ArrowUpRight className="size-4" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
      </article>

      {products.length > 0 && (
        <section aria-labelledby="shop-story" className="mt-24">
          <SectionHeading id="shop-story" eyebrow="In this story" title="Shop the story" />
          <ProductGrid products={products} />
        </section>
      )}

      {more.length > 0 && (
        <section aria-labelledby="more-stories" className="mt-24">
          <SectionHeading id="more-stories" eyebrow="Keep reading" title="More from the journal" />
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            {more.map((a) => (
              <JournalCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function ArticlePage({ params }: PageProps<"/journal/[slug]">) {
  return (
    <Suspense fallback={<div className="container-page animate-pulse py-14" aria-hidden><div className="mx-auto h-10 w-2/3 rounded bg-secondary" /><div className="mt-10 aspect-[16/9] rounded-2xl bg-secondary" /></div>}>
      <Content params={params} />
    </Suspense>
  );
}
