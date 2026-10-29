import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ActionButton, Toggle } from "@/components/admin/action-button";
import { AdminLoading, Notice, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPriceRange } from "@/lib/format";
import { setProductFeatured, setProductPublished, syncCatalog } from "../../actions";

export const metadata: Metadata = { title: "Produk" };

const FILTERS = { all: "Semua", published: "Dijual", hidden: "Disembunyikan" } as const;

async function ProductList({ searchParams }: Pick<PageProps<"/admin/products">, "searchParams">) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const show = (typeof params.show === "string" && params.show in FILTERS ? params.show : "all") as keyof typeof FILTERS;

  const products = await db.product.findMany({
    where: {
      deletedAt: null,
      ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
      ...(show === "published" ? { published: true } : show === "hidden" ? { published: false } : {}),
    },
    include: { variants: { select: { retailPrice: true, currency: true, enabled: true } } },
    orderBy: [{ published: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  const publishedCount = await db.product.count({ where: { deletedAt: null, published: true } });

  return (
    <>
      <PageHeader
        title="Produk"
        description={`${publishedCount} produk dijual. Produk baru dari Printful masuk dalam keadaan tersembunyi — aktifkan "Tampil" untuk menjualnya.`}
        actions={<ActionButton action={syncCatalog} variant="primary">Sinkronkan dari Printful</ActionButton>}
      />

      <form className="mb-5 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari nama produk…"
          className="min-w-60 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <select name="show" defaultValue={show} className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
          {Object.entries(FILTERS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">Filter</button>
      </form>

      {products.length === 0 ? (
        <Notice tone="info">
          {q || show !== "all"
            ? "Tidak ada produk yang cocok dengan filter."
            : 'Belum ada produk. Klik "Sinkronkan dari Printful" untuk mengimpor produk dari toko Printful Anda.'}
        </Notice>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Produk</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Varian</th>
                <th className="px-4 py-3 font-medium">Harga</th>
                <th className="px-4 py-3 font-medium">Tampil</th>
                <th className="px-4 py-3 font-medium">Unggulan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => {
                const id = p.id.toString();
                const active = p.variants.filter((v) => v.enabled);
                const prices = active.map((v) => Number(v.retailPrice));
                return (
                  <tr key={id} className="align-middle">
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${id}`} className="flex items-center gap-3 hover:text-primary">
                        <span className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-line bg-paper">
                          {p.thumbnailUrl && <Image src={p.thumbnailUrl} alt="" fill sizes="48px" className="object-contain" />}
                        </span>
                        <span>
                          <span className="font-medium">{p.title || p.name}</span>
                          {p.title && <span className="block text-xs text-muted-foreground">{p.name}</span>}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.categoryName ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.detailsSyncedAt ? `${active.length} / ${p.variants.length}` : p.variantCount}
                    </td>
                    <td className="px-4 py-3">
                      {prices.length ? formatPriceRange(Math.min(...prices), Math.max(...prices), active[0].currency) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Toggle checked={p.published} action={setProductPublished.bind(null, id)} label="Tampilkan di toko" />
                    </td>
                    <td className="px-4 py-3">
                      <Toggle checked={p.featured} action={setProductFeatured.bind(null, id)} label="Produk unggulan" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <ProductList searchParams={searchParams} />
    </Suspense>
  );
}
