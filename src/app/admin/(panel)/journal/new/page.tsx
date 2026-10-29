import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminLoading, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { saveArticle } from "../../../journal-actions";
import { getCategories, getCoverLibrary, getLinkableProducts } from "../data";
import { JournalEditor } from "../journal-editor";

export const metadata: Metadata = { title: "Artikel baru" };

async function NewArticle() {
  await requireAdmin();
  await connection();
  const [library, products, categories] = await Promise.all([getCoverLibrary(), getLinkableProducts(), getCategories()]);

  return (
    <>
      <Link href="/admin/journal" className="text-sm text-muted-foreground hover:text-ink">
        ← Semua artikel
      </Link>
      <div className="mt-3">
        <PageHeader title="Artikel baru" description="Tulis cerita Mika. Simpan tanpa mencentang “Tampilkan di situs” untuk menyimpannya sebagai draft." />
      </div>
      <JournalEditor
        action={saveArticle.bind(null, null)}
        library={library}
        products={products}
        categories={categories}
        article={{
          title: "",
          slug: "",
          category: "Everyday",
          excerpt: "",
          body: "",
          publishedAt: new Date().toISOString().slice(0, 10),
          published: false,
          coverSrc: "",
          coverAlt: "",
          coverKind: "photo",
          coverAi: true,
          productIds: [],
          videoPlatform: "",
          videoUrl: "",
        }}
      />
    </>
  );
}

export default function NewArticlePage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <NewArticle />
    </Suspense>
  );
}
