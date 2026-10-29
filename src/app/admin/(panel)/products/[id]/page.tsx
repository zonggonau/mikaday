import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionButton, Toggle } from "@/components/admin/action-button";
import { AdminLoading, Card, Notice, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, formatMoney } from "@/lib/format";
import { resyncProduct, setProductFeatured, setProductPublished, setVariantEnabled, updateProduct } from "../../../actions";
import { ProductForm } from "./product-form";

export const metadata: Metadata = { title: "Edit produk" };

async function ProductEditor({ params }: Pick<PageProps<"/admin/products/[id]">, "params">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const product = await db.product.findUnique({
    where: { id: BigInt(id) },
    include: { variants: { orderBy: { position: "asc" } } },
  });
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/products" className="text-sm text-muted-foreground hover:text-ink">
        ← Semua produk
      </Link>
      <div className="mt-3">
        <PageHeader
          title={product.title || product.name}
          description={
            <>
              Printful ID {id} · {product.categoryName ?? "Tanpa kategori"}
              {product.detailsSyncedAt && <> · Sinkron {formatDateTime(product.detailsSyncedAt)}</>}
            </>
          }
          actions={
            <>
              {product.published && (
                <Link href={`/shop/${product.slug}`} target="_blank" className="rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium hover:border-ink">
                  Lihat di toko ↗
                </Link>
              )}
              <ActionButton action={resyncProduct.bind(null, id)}>Sinkron ulang</ActionButton>
            </>
          }
        />
      </div>

      {product.deletedAt && (
        <div className="mb-6">
          <Notice tone="danger">Produk ini sudah dihapus dari Printful dan tidak bisa dijual.</Notice>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card title="Konten toko">
          <ProductForm
            action={updateProduct.bind(null, id)}
            defaults={{
              name: product.name,
              title: product.title ?? "",
              description: product.description ?? "",
              sortOrder: product.sortOrder,
            }}
          />
        </Card>

        <div className="space-y-6">
          <Card title="Status">
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span>Tampil di toko</span>
                <Toggle checked={product.published} action={setProductPublished.bind(null, id)} label="Tampilkan di toko" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Produk unggulan (beranda)</span>
                <Toggle checked={product.featured} action={setProductFeatured.bind(null, id)} label="Produk unggulan" />
              </div>
            </div>
          </Card>
          {product.thumbnailUrl && (
            <Card>
              <div className="relative aspect-square">
                <Image src={product.thumbnailUrl} alt="" fill sizes="340px" className="object-contain" />
              </div>
            </Card>
          )}
        </div>
      </div>

      <Card title={`Varian (${product.variants.length})`} className="mt-6">
        {product.variants.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Detail varian belum diambil. Klik &quot;Sinkron ulang&quot; atau aktifkan &quot;Tampil di toko&quot;.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 font-medium">Varian</th>
                  <th className="py-2 pr-4 font-medium">SKU</th>
                  <th className="py-2 pr-4 font-medium">Harga jual</th>
                  <th className="py-2 pr-4 font-medium">Biaya dasar</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">Dijual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {product.variants.map((v) => {
                  const price = Number(v.retailPrice);
                  const cost = v.cost ? Number(v.cost) : null;
                  return (
                    <tr key={v.id.toString()}>
                      <td className="py-2 pr-4">
                        <span className="flex items-center gap-2">
                          {v.colorCode && <span className="size-3.5 rounded-full border border-black/10" style={{ backgroundColor: v.colorCode }} />}
                          {[v.color, v.size].filter(Boolean).join(" / ") || v.name}
                        </span>
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{v.sku}</td>
                      <td className="py-2 pr-4">{formatMoney(price, v.currency)}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {cost !== null ? (
                          <>
                            {formatMoney(cost, v.currency)}{" "}
                            <span className="text-xs">(margin {formatMoney(price - cost, v.currency)})</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        <span className={v.availability === "active" ? "text-success" : "text-danger"}>{v.availability}</span>
                      </td>
                      <td className="py-2">
                        <Toggle checked={v.enabled} action={setVariantEnabled.bind(null, v.id.toString())} label="Jual varian ini" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Harga jual diatur di dashboard Printful (retail price) lalu disinkronkan. Biaya dasar adalah harga produk Printful sebelum ongkir dan pajak.
        </p>
      </Card>
    </>
  );
}

export default function AdminProductPage({ params }: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <ProductEditor params={params} />
    </Suspense>
  );
}
