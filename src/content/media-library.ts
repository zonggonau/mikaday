/**
 * Site images in public/images that editors can pick as journal covers.
 * Listed here (not read from disk) because on Vercel the public folder is served
 * from the CDN and is not available to server functions.
 */
export const siteImages: { file: string; kind: "photo" | "illustration" }[] = [
  // AI-generated photos of Mika (labelled "AI-generated" on the site)
  { file: "mika/mika-portrait.jpg", kind: "photo" },
  { file: "mika/mika-breakfast-mug.jpg", kind: "photo" },
  { file: "mika/mika-home-desk-mug.jpg", kind: "photo" },
  { file: "mika/mika-studio-mug.jpg", kind: "photo" },
  { file: "mika/mika-porch-mug.jpg", kind: "photo" },
  { file: "mika/mika-profile-left.jpg", kind: "photo" },
  { file: "mika/mika-profile-right.jpg", kind: "photo" },
  // Original illustrations
  { file: "hero.svg", kind: "illustration" },
  { file: "portrait.svg", kind: "illustration" },
  { file: "workspace.svg", kind: "illustration" },
  { file: "shop-the-moment.svg", kind: "illustration" },
  { file: "journal-slow-morning.svg", kind: "illustration" },
  { file: "journal-sketch.svg", kind: "illustration" },
  { file: "journal-pack.svg", kind: "illustration" },
];
