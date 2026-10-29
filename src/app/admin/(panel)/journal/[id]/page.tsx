import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionButton } from "@/components/admin/action-button";
import { AdminLoading, Notice, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { deleteArticle, saveArticle } from "../../../journal-actions";
import { getCategories, getCoverLibrary, getLinkableProducts } from "../data";
import { JournalEditor } from "../journal-editor";

export const metadata: Metadata = { title: "Edit artikel" };

async function EditArticle({ params, searchParams }: Pick<PageProps<"/admin/journal/[id]">, "params" | "searchParams">) {
  await requireAdmin();
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const article = await db.journalArticle.findUnique({ where: { id } });
  if (!article) notFound();

  const [library, products, categories] = await Promise.all([getCoverLibrary(), getLinkableProducts(), getCategories()]);

  return (
    <>
      <Link href="/admin/journal" className="text-sm text-muted-foreground hover:text-ink">
        ← Semua artikel
      </Link>
      <div className="mt-3">
        <PageHeader
          title={article.title}
          description={`${article.published ? "Tampil di situs" : "Draft"} · diubah ${formatDateTime(article.updatedAt)}`}
          actions={
            <>
              {article.published && (
                <Link
                  href={`/journal/${article.slug}`}
                  target="_blank"
                  className="inline-flex h-10 items-center rounded-lg border border-line bg-white px-4 text-sm font-medium hover:border-ink"
                >
                  Lihat di situs ↗
                </Link>
              )}
              <ActionButton
                action={deleteArticle.bind(null, article.id)}
                variant="danger"
                confirm={`Hapus artikel “${article.title}”? Tindakan ini tidak bisa dibatalkan.`}
              >
                Hapus
              </ActionButton>
            </>
          }
        />
      </div>
      {created && (
        <div className="mb-5">
          <Notice tone="success">Artikel dibuat.</Notice>
        </div>
      )}
      <JournalEditor
        key={article.updatedAt.toISOString()}
        action={saveArticle.bind(null, article.id)}
        library={library}
        products={products}
        categories={categories}
        article={{
          title: article.title,
          slug: article.slug,
          category: article.category,
          excerpt: article.excerpt,
          body: article.body,
          publishedAt: article.publishedAt.toISOString().slice(0, 10),
          published: article.published,
          coverSrc: article.coverSrc ?? "",
          coverAlt: article.coverAlt,
          coverKind: article.coverKind === "illustration" ? "illustration" : "photo",
          coverAi: article.coverAi,
          productIds: article.productIds,
          videoPlatform: article.videoPlatform ?? "",
          videoUrl: article.videoUrl ?? "",
        }}
      />
    </>
  );
}

export default function EditArticlePage({ params, searchParams }: PageProps<"/admin/journal/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <EditArticle params={params} searchParams={searchParams} />
    </Suspense>
  );
}
