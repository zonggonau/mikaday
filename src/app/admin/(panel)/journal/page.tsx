import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ActionButton, Toggle } from "@/components/admin/action-button";
import { AdminLoading, Notice, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { importSamples, setArticlePublished } from "../../journal-actions";

export const metadata: Metadata = { title: "Jurnal" };

async function ArticleList({ searchParams }: Pick<PageProps<"/admin/journal">, "searchParams">) {
  await requireAdmin();
  const { deleted, imported } = await searchParams;
  const articles = await db.journalArticle.findMany({ orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }] });

  return (
    <>
      <PageHeader
        title="Jurnal"
        description="Cerita Mika yang tampil di /journal, beranda, dan halaman produk terkait."
        actions={
          <Link href="/admin/journal/new" className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
            Tulis artikel baru
          </Link>
        }
      />
      {deleted && (
        <div className="mb-5">
          <Notice tone="success">Artikel dihapus.</Notice>
        </div>
      )}
      {typeof imported === "string" && (
        <div className="mb-5">
          <Notice tone="success">{imported === "0" ? "Semua artikel contoh sudah ada." : `${imported} artikel contoh diimpor dan tampil di situs.`}</Notice>
        </div>
      )}
      {articles.length === 0 ? (
        <div className="space-y-4">
          <Notice tone="info">
            Belum ada artikel di database. Impor 3 artikel contoh (yang selama ini tampil di situs) agar bisa diedit, atau tulis artikel baru.
          </Notice>
          <ActionButton action={importSamples} variant="primary">
            Impor artikel contoh
          </ActionButton>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-line text-left text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Artikel</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Produk</th>
                <th className="px-4 py-3 font-medium">Tampil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {articles.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/journal/${a.id}`} className="flex items-center gap-3 hover:text-primary">
                      <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md border border-line bg-paper">
                        {a.coverSrc && <Image src={a.coverSrc} alt="" fill sizes="64px" className="object-cover" />}
                      </span>
                      <span>
                        <span className="font-medium">{a.title}</span>
                        <span className="block font-mono text-xs text-muted-foreground">/journal/{a.slug}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.category}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(a.publishedAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.productIds.length}</td>
                  <td className="px-4 py-3">
                    <Toggle checked={a.published} action={setArticlePublished.bind(null, a.id)} label="Tampilkan di situs" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function AdminJournalPage({ searchParams }: PageProps<"/admin/journal">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <ArticleList searchParams={searchParams} />
    </Suspense>
  );
}
