import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { articles as sampleArticles } from "@/content/journal";
import type { ArticleBlock, JournalArticle } from "@/content/types";
import type { JournalArticle as JournalRow } from "@/generated/prisma/client";
import { db } from "./db";

/** Every public journal read is tagged so saving in Admin → Jurnal updates the site immediately. */
export const JOURNAL_TAG = "journal";

export const VIDEO_PLATFORMS = ["TikTok", "Instagram", "YouTube"] as const;
export type VideoPlatform = (typeof VIDEO_PLATFORMS)[number];

/** A blank line starts a new paragraph; a line starting with "## " is a subheading. */
export function parseBody(text: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  for (const chunk of text.replace(/\r\n/g, "\n").split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    let paragraph: string[] = [];
    const flush = () => {
      if (paragraph.length) blocks.push({ type: "p", text: paragraph.join(" ") });
      paragraph = [];
    };
    for (const line of lines) {
      if (line.startsWith("## ")) {
        flush();
        blocks.push({ type: "h2", text: line.slice(3).trim() });
      } else {
        paragraph.push(line);
      }
    }
    flush();
  }
  return blocks;
}

export function serializeBody(blocks: ArticleBlock[]) {
  return blocks.map((b) => (b.type === "h2" ? `## ${b.text}` : b.text)).join("\n\n");
}

function toArticle(row: JournalRow): JournalArticle {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt,
    publishedAt: row.publishedAt.toISOString().slice(0, 10),
    cover: {
      src: row.coverSrc ?? undefined,
      alt: row.coverAlt || row.title,
      brief: `Cover image for “${row.title}”.`,
      kind: row.coverKind === "illustration" ? "illustration" : "photo",
      conceptual: row.coverAi,
    },
    body: parseBody(row.body),
    productIds: row.productIds,
    video:
      row.videoUrl && VIDEO_PLATFORMS.includes(row.videoPlatform as VideoPlatform)
        ? { platform: row.videoPlatform as VideoPlatform, url: row.videoUrl }
        : undefined,
  };
}

export async function getPublishedArticles(): Promise<JournalArticle[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(JOURNAL_TAG);

  const rows = await db.journalArticle.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toArticle);
}

export async function getPublishedArticle(slug: string): Promise<JournalArticle | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(JOURNAL_TAG);

  const row = await db.journalArticle.findFirst({ where: { slug, published: true } });
  return row ? toArticle(row) : null;
}

/** One-time import of the stories that used to live in src/content/journal.ts. */
export async function importSampleArticles() {
  let created = 0;
  for (const a of sampleArticles) {
    const exists = await db.journalArticle.findUnique({ where: { slug: a.slug }, select: { id: true } });
    if (exists) continue;
    await db.journalArticle.create({
      data: {
        slug: a.slug,
        title: a.title,
        category: a.category,
        excerpt: a.excerpt,
        body: serializeBody(a.body),
        coverSrc: a.cover.src ?? null,
        coverAlt: a.cover.alt,
        coverKind: a.cover.kind ?? "photo",
        coverAi: a.cover.conceptual ?? true,
        productIds: a.productIds,
        videoPlatform: a.video?.platform ?? null,
        videoUrl: a.video?.url ?? null,
        published: true,
        publishedAt: new Date(`${a.publishedAt}T12:00:00Z`),
      },
    });
    created += 1;
  }
  return created;
}
