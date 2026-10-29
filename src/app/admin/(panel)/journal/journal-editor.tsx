"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import { preservingSubmit } from "@/lib/use-preserving-form";
import type { SaveArticleState } from "@/app/admin/journal-actions";
import { slugify } from "@/lib/format";

export interface EditorArticle {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  body: string;
  publishedAt: string;
  published: boolean;
  coverSrc: string;
  coverAlt: string;
  coverKind: "photo" | "illustration";
  coverAi: boolean;
  productIds: string[];
  videoPlatform: string;
  videoUrl: string;
}

const field = "w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40";
const label = "grid gap-1 text-sm font-medium";
const hint = "text-xs font-normal text-muted-foreground";

export function JournalEditor({
  action,
  article,
  library,
  products,
  categories,
}: {
  action: (previous: SaveArticleState, formData: FormData) => Promise<SaveArticleState>;
  article: EditorArticle;
  library: { src: string; label: string }[];
  products: { id: string; title: string; imageUrl: string | null }[];
  categories: string[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [title, setTitle] = useState(article.title);
  const [slug, setSlug] = useState(article.slug);
  const [excerpt, setExcerpt] = useState(article.excerpt);
  const [coverSrc, setCoverSrc] = useState(article.coverSrc);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>(article.productIds);
  const [query, setQuery] = useState("");

  const effectiveSlug = slugify(slug || title);
  const visibleProducts = useMemo(
    () => products.filter((p) => !query || p.title.toLowerCase().includes(query.toLowerCase())),
    [products, query],
  );
  const preview = uploadPreview ?? coverSrc;

  return (
    <form onSubmit={preservingSubmit(formAction)} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5 rounded-2xl border border-line bg-white p-5">
        <label className={label}>
          Judul
          <input name="title" required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} className={`${field} text-base`} />
        </label>
        <label className={label}>
          Slug (URL)
          <input name="slug" maxLength={100} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={slugify(title)} className={`${field} font-mono`} />
          <span className={hint}>/journal/{effectiveSlug || "…"} — kosongkan untuk dibuat otomatis dari judul.</span>
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={label}>
            Kategori
            <input name="category" required maxLength={40} list="journal-categories" defaultValue={article.category} className={field} />
            <datalist id="journal-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className={label}>
            Tanggal terbit
            <input name="publishedAt" type="date" required defaultValue={article.publishedAt} className={field} />
          </label>
        </div>
        <label className={label}>
          Ringkasan
          <textarea name="excerpt" required rows={2} maxLength={300} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className={field} />
          <span className={hint}>{excerpt.length}/300 — tampil di kartu jurnal dan hasil pencarian Google.</span>
        </label>
        <label className={label}>
          Isi artikel
          <textarea name="body" required rows={18} defaultValue={article.body} className={`${field} leading-relaxed`} />
          <span className={hint}>
            Baris kosong = paragraf baru. Awali baris dengan <code>## </code> untuk subjudul. Tulis dalam bahasa Inggris sebagai cerita fiksi Mika — jangan
            menulis klaim produk (bahan, ukuran, ketahanan) di sini.
          </span>
        </label>
      </div>

      <div className="space-y-6">
        <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-semibold">Publikasi</h2>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" name="published" defaultChecked={article.published} className="size-5 accent-[#b94716]" />
            Tampilkan di situs
          </label>
          {state.error && <p className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{state.error}</p>}
          {state.ok && <p className="rounded-lg bg-success-soft p-3 text-sm text-success">{state.message}</p>}
          <button type="submit" disabled={pending} className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">
            {pending ? "Menyimpan…" : "Simpan"}
          </button>
        </section>

        <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-semibold">Gambar cover</h2>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-paper">
            {preview ? (
              uploadPreview ? (
                // A local blob preview cannot go through next/image.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={uploadPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <Image src={preview} alt="" fill sizes="360px" className="object-cover" />
              )
            ) : (
              <p className="grid h-full place-items-center text-sm text-muted-foreground">Belum ada cover (placeholder tampil di situs)</p>
            )}
          </div>
          <label className={label}>
            Pilih dari pustaka
            <select name="coverSrc" value={coverSrc} onChange={(e) => setCoverSrc(e.target.value)} className={`${field} h-10`}>
              <option value="">— Tanpa cover —</option>
              {library.map((img) => (
                <option key={img.src} value={img.src}>
                  {img.label}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            Atau unggah baru
            <input
              name="coverFile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setUploadPreview(file ? URL.createObjectURL(file) : null);
              }}
              className="text-sm"
            />
            <span className={hint}>JPG, PNG, atau WebP, maks. 4 MB. Rasio 16:9 disarankan.</span>
          </label>
          <label className={label}>
            Teks alternatif (alt)
            <input name="coverAlt" maxLength={250} defaultValue={article.coverAlt} className={field} />
            <span className={hint}>Deskripsikan isi gambar untuk pembaca layar.</span>
          </label>
          <label className={label}>
            Jenis gambar
            <select name="coverKind" defaultValue={article.coverKind} className={`${field} h-10`}>
              <option value="photo">Foto</option>
              <option value="illustration">Ilustrasi</option>
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" name="coverAi" defaultChecked={article.coverAi} className="size-5 accent-[#b94716]" />
            Gambar AI / konseptual (diberi label di situs)
          </label>
        </section>

        <section className="space-y-3 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-semibold">Produk dalam cerita</h2>
          <p className={hint}>Tampil sebagai “Shop the story” di bawah artikel dan “Seen in Mika&apos;s journal” di halaman produk.</p>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari produk…" className={`${field} h-10`} />
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {visibleProducts.map((p) => {
              const checked = selected.includes(p.id);
              return (
                <li key={p.id}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm hover:bg-paper">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setSelected((s) => (checked ? s.filter((id) => id !== p.id) : [...s, p.id]))}
                      className="size-4 accent-[#b94716]"
                    />
                    <span className="relative size-9 shrink-0 overflow-hidden rounded-md border border-line bg-paper">
                      {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="36px" className="object-contain" />}
                    </span>
                    <span className="line-clamp-2">{p.title}</span>
                  </label>
                </li>
              );
            })}
            {visibleProducts.length === 0 && <li className="px-2 py-3 text-sm text-muted-foreground">Tidak ada produk yang cocok.</li>}
          </ul>
          {selected.map((id) => (
            <input key={id} type="hidden" name="productIds" value={id} />
          ))}
          <p className={hint}>{selected.length} produk dipilih. Hanya produk yang sedang dijual yang tampil di situs.</p>
        </section>

        <section className="space-y-3 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-semibold">Video cerita (opsional)</h2>
          <select name="videoPlatform" defaultValue={article.videoPlatform} className={`${field} h-10`}>
            <option value="">— Platform —</option>
            <option value="TikTok">TikTok</option>
            <option value="Instagram">Instagram</option>
            <option value="YouTube">YouTube</option>
          </select>
          <input name="videoUrl" type="url" defaultValue={article.videoUrl} placeholder="https://www.tiktok.com/@…/video/…" className={field} />
          <p className={hint}>Tampil sebagai tombol “Watch this story on …” di artikel.</p>
        </section>
      </div>
    </form>
  );
}
