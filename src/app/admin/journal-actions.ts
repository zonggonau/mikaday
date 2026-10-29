"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/format";
import { importSampleArticles, JOURNAL_TAG, VIDEO_PLATFORMS } from "@/lib/journal";
import type { ActionResult } from "./actions";

const MAX_UPLOAD = 4 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_HOSTS: Record<(typeof VIDEO_PLATFORMS)[number], RegExp> = {
  TikTok: /(^|\.)tiktok\.com$/,
  Instagram: /(^|\.)instagram\.com$/,
  YouTube: /(^|\.)(youtube\.com|youtu\.be)$/,
};

const schema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter.").max(160),
  slug: z.string().trim().max(100),
  category: z.string().trim().min(2, "Isi kategori.").max(40),
  excerpt: z.string().trim().min(10, "Ringkasan minimal 10 karakter.").max(300, "Ringkasan maksimal 300 karakter."),
  body: z.string().trim().min(20, "Isi artikel minimal 20 karakter.").max(50_000),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid."),
  published: z.boolean(),
  coverSrc: z.string().trim().max(200),
  coverAlt: z.string().trim().max(250),
  coverKind: z.enum(["photo", "illustration"]),
  coverAi: z.boolean(),
  productIds: z.array(z.string().regex(/^\d+$/)).max(12),
  videoPlatform: z.enum(["", ...VIDEO_PLATFORMS]),
  videoUrl: z.string().trim().max(500),
});

export type SaveArticleState = { ok?: boolean; message?: string; error?: string };

function articlesChanged() {
  updateTag(JOURNAL_TAG);
  refresh();
}

export async function saveArticle(articleId: string | null, _previous: SaveArticleState, formData: FormData): Promise<SaveArticleState> {
  await requireAdmin();

  const parsed = schema.safeParse({
    title: formData.get("title") ?? "",
    slug: formData.get("slug") ?? "",
    category: formData.get("category") ?? "",
    excerpt: formData.get("excerpt") ?? "",
    body: formData.get("body") ?? "",
    publishedAt: formData.get("publishedAt") ?? "",
    published: formData.get("published") === "on",
    coverSrc: formData.get("coverSrc") ?? "",
    coverAlt: formData.get("coverAlt") ?? "",
    coverKind: formData.get("coverKind") ?? "photo",
    coverAi: formData.get("coverAi") === "on",
    productIds: formData.getAll("productIds").map(String),
    videoPlatform: formData.get("videoPlatform") ?? "",
    videoUrl: formData.get("videoUrl") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Periksa kembali isian." };
  const data = parsed.data;

  const slug = slugify(data.slug || data.title);
  if (!slug) return { error: "Slug tidak valid." };
  const clash = await db.journalArticle.findUnique({ where: { slug }, select: { id: true } });
  if (clash && clash.id !== articleId) return { error: `Slug “${slug}” sudah dipakai artikel lain.` };

  // Cover: a new upload wins; otherwise keep the chosen library image (local paths only).
  let coverSrc = data.coverSrc || null;
  if (coverSrc && !/^\/(images|media)\/(?:[\w-]+\/)?[\w-]+(?:\.\w+)?$/.test(coverSrc)) return { error: "Gambar cover tidak valid." };
  const file = formData.get("coverFile");
  if (file instanceof File && file.size > 0) {
    if (!IMAGE_TYPES.has(file.type)) return { error: "Cover harus JPG, PNG, atau WebP." };
    if (file.size > MAX_UPLOAD) return { error: "Ukuran cover maksimal 4 MB." };
    const media = await db.media.create({
      data: { filename: file.name.slice(0, 200), mimeType: file.type, size: file.size, data: new Uint8Array(await file.arrayBuffer()) },
    });
    coverSrc = `/media/${media.id}`;
  }
  if (coverSrc && !data.coverAlt) return { error: "Isi teks alternatif (alt) untuk gambar cover." };

  let videoUrl: string | null = null;
  if (data.videoUrl) {
    if (!data.videoPlatform) return { error: "Pilih platform video." };
    let url: URL;
    try {
      url = new URL(data.videoUrl);
    } catch {
      return { error: "Link video tidak valid." };
    }
    if (url.protocol !== "https:" || !VIDEO_HOSTS[data.videoPlatform].test(url.hostname)) {
      return { error: `Link video harus https dari ${data.videoPlatform}.` };
    }
    videoUrl = url.toString();
  }

  const values = {
    slug,
    title: data.title,
    category: data.category,
    excerpt: data.excerpt,
    body: data.body,
    publishedAt: new Date(`${data.publishedAt}T12:00:00Z`),
    published: data.published,
    coverSrc,
    coverAlt: data.coverAlt,
    coverKind: data.coverKind,
    coverAi: data.coverAi,
    productIds: [...new Set(data.productIds)],
    videoPlatform: videoUrl ? data.videoPlatform : null,
    videoUrl,
  };

  const saved = articleId
    ? await db.journalArticle.update({ where: { id: articleId }, data: values })
    : await db.journalArticle.create({ data: values });
  articlesChanged();

  if (!articleId) redirect(`/admin/journal/${saved.id}?created=1`);
  return { ok: true, message: saved.published ? "Tersimpan dan tampil di situs." : "Tersimpan sebagai draft." };
}

export async function setArticlePublished(articleId: string, published: boolean): Promise<ActionResult> {
  await requireAdmin();
  try {
    await db.journalArticle.update({ where: { id: articleId }, data: { published } });
    articlesChanged();
    return { ok: true, message: published ? "Artikel diterbitkan." : "Artikel disembunyikan (draft)." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Gagal menyimpan." };
  }
}

export async function deleteArticle(articleId: string): Promise<ActionResult> {
  await requireAdmin();
  await db.journalArticle.delete({ where: { id: articleId } });
  updateTag(JOURNAL_TAG);
  redirect("/admin/journal?deleted=1");
}

export async function importSamples(): Promise<ActionResult> {
  await requireAdmin();
  const created = await importSampleArticles();
  updateTag(JOURNAL_TAG);
  // The import button disappears once articles exist, so report the result on the list page.
  redirect(`/admin/journal?imported=${created}`);
}
