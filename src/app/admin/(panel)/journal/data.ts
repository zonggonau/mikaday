import "server-only";
import { siteImages } from "@/content/media-library";
import { db } from "@/lib/db";

/** Images the editor can pick as a cover: site photos and illustrations plus earlier uploads. */
export async function getCoverLibrary() {
  const uploads = await db.media.findMany({ select: { id: true, filename: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return [
    ...siteImages.map((img) => ({
      src: `/images/${img.file}`,
      label: `${img.kind === "photo" ? "Foto" : "Ilustrasi"}: ${img.file.replace(/^mika\//, "")}`,
    })),
    ...uploads.map((m) => ({ src: `/media/${m.id}`, label: `Unggahan: ${m.filename}` })),
  ];
}

/** Products that can be linked to a story (published ones). */
export async function getLinkableProducts() {
  const products = await db.product.findMany({
    where: { published: true, deletedAt: null },
    select: { id: true, name: true, title: true, thumbnailUrl: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return products.map((p) => ({ id: p.id.toString(), title: p.title || p.name, imageUrl: p.thumbnailUrl }));
}

export async function getCategories() {
  const rows = await db.journalArticle.findMany({ select: { category: true }, distinct: ["category"] });
  return [...new Set(["Everyday", "Design notes", "Style", "Story", ...rows.map((r) => r.category)])];
}
