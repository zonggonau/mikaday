/** Public, client-safe store settings (NEXT_PUBLIC_* values are inlined at build time). */

const social = [
  { name: "Instagram", url: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM },
  { name: "TikTok", url: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK },
  { name: "YouTube", url: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE },
  { name: "Facebook", url: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK },
] as const;

export type SocialName = (typeof social)[number]["name"];

export const site = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || "MIKADAY",
  tagline: "Create. Sip. Explore.",
  description:
    "Original designs inspired by the everyday world of Mika, an AI virtual creator — coffee, creativity, and little adventures.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  /** Single display currency. Add more only when real pricing and payment support exist. */
  currency: (process.env.NEXT_PUBLIC_STORE_CURRENCY || "USD").toUpperCase(),
  paypalClientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
  /** Shown on the contact page only when configured. */
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  /** Only links that are configured are rendered; nothing is invented. */
  social: social.filter((s): s is { name: SocialName; url: string } => Boolean(s.url)),
};
