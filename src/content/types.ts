/**
 * Content model for editorial data. Today it is read from the files in src/content;
 * src/lib/content.ts is the adapter to swap for a CMS (e.g. SaCMS) later.
 */

/** An image slot. Without `src` a labelled placeholder is shown until an approved image is added. */
export interface ImageAsset {
  src?: string;
  alt: string;
  /** What the final image should show — displayed on the placeholder. */
  brief: string;
  /** True for AI/lifestyle imagery that is not a photo of a physical product sample. */
  conceptual?: boolean;
  /** "illustration" is labelled as such; photos keep the AI-generated label when conceptual. */
  kind?: "photo" | "illustration";
  width?: number;
  height?: number;
}

export interface MikaProfile {
  name: string;
  age: number;
  hometown: string;
  role: string;
  shortBio: string;
  bio: string[];
  interests: { title: string; body: string }[];
  portrait: ImageAsset;
  workspace: ImageAsset;
  disclosure: string;
}

export interface Collection {
  slug: string;
  name: string;
  heading: string;
  summary: string;
  story: string[];
  /** Printful sync product IDs (shown in the admin product page). Unpublished IDs are skipped. */
  productIds: string[];
  /** Planned pieces that are not for sale yet. Never shown with prices or specs. */
  upcoming: { name: string; note: string }[];
  art: "mountain-sunset";
}

export type ArticleBlock = { type: "p"; text: string } | { type: "h2"; text: string };

export interface JournalArticle {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  publishedAt: string; // ISO date
  cover: ImageAsset;
  body: ArticleBlock[];
  /** Products Mika "uses" in the story (Printful sync product IDs). */
  productIds: string[];
  /** Optional link to the short video version of the story. Hidden when absent. */
  video?: { platform: "TikTok" | "Instagram" | "YouTube"; url: string };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface PolicySection {
  heading: string;
  body: string[];
}

export interface PolicyPage {
  slug: "shipping" | "returns" | "privacy" | "terms";
  title: string;
  /** Draft policies are labelled until the store owner confirms the real business rules. */
  draft: boolean;
  intro: string;
  sections: PolicySection[];
}
