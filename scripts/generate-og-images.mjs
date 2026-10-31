// Builds the static Open Graph images (public/og) and the schema.org logo (public/brand/logo.png).
// Run from the project root after changing photos in public/images/mika: node scripts/generate-og-images.mjs
// Text uses Georgia / Segoe UI, so run it on a machine that has those fonts (e.g. Windows or macOS).
import fs from "node:fs";
import sharp from "sharp";
const W = 1200, H = 630;

async function photoCrop(file, width, height, focusY) {
  // Cover-crop a portrait photo to width×height, keeping the band around focusY (0–1 of the source height).
  const img = sharp(`public/images/mika/${file}`);
  const { width: sw, height: sh } = await img.metadata();
  const scale = Math.max(width / sw, height / sh);
  const rw = Math.round(sw * scale), rh = Math.round(sh * scale);
  const top = Math.max(0, Math.min(rh - height, Math.round(focusY * rh - height / 2)));
  const left = Math.max(0, Math.round((rw - width) / 2));
  return sharp(`public/images/mika/${file}`).resize(rw, rh).extract({ left, top, width, height }).toBuffer();
}

function aiTag(x, y) {
  return `<g><rect x="${x}" y="${y}" rx="8" width="196" height="34" fill="#FAF7F2" fill-opacity="0.92"/>
<text x="${x + 98}" y="${y + 22}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="600" fill="#242424">AI-generated image</text></g>`;
}

// 1. Site card: cream panel + photo.
const photoW = 560;
const photo = await photoCrop("mika-breakfast-mug.jpg", photoW, H, 0.42);
const panel = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="#FAF7F2"/>
<text x="72" y="210" font-family="Georgia, serif" font-size="76" letter-spacing="12" fill="#242424">MIKADAY</text>
<rect x="74" y="238" width="72" height="6" rx="3" fill="#E87932"/>
<text x="72" y="320" font-family="Georgia, serif" font-size="40" fill="#242424">Create. Sip. Explore.</text>
<text x="72" y="392" font-family="Segoe UI, Arial, sans-serif" font-size="25" fill="#655E57">Original designs inspired by Mika,</text>
<text x="72" y="428" font-family="Segoe UI, Arial, sans-serif" font-size="25" fill="#655E57">an AI virtual creator.</text>
<text x="72" y="540" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" fill="#B94716">mikaday.store</text>
</svg>`);
await sharp(panel)
  .composite([{ input: photo, left: W - photoW, top: 0 }, { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${aiTag(W - photoW + 20, H - 54)}</svg>`), left: 0, top: 0 }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile("public/og/mikaday.jpg");
console.log("og/mikaday.jpg");

// 2. Landscape versions of the scene photos (journal covers and pages that use them).
const crops = {
  "mika-breakfast-mug.jpg": 0.28,
  "mika-home-desk-mug.jpg": 0.29,
  "mika-studio-mug.jpg": 0.29,
  "mika-porch-mug.jpg": 0.28,
};
for (const [file, focus] of Object.entries(crops)) {
  const base = await photoCrop(file, W, H, focus);
  await sharp(base)
    .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${aiTag(24, H - 58)}</svg>`), left: 0, top: 0 }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(`public/og/${file}`);
  console.log(`og/${file}`);
}

// 2b. Meet Mika card: same layout as the site card, with the portrait.
{
  const photoW = 560;
  const photo = await photoCrop("mika-portrait.jpg", photoW, H, 0.42);
  const panel = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="#FAF7F2"/>
<text x="72" y="150" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="4" fill="#B94716">MIKADAY</text>
<text x="72" y="250" font-family="Georgia, serif" font-size="78" fill="#242424">Meet Mika</text>
<rect x="74" y="280" width="72" height="6" rx="3" fill="#E87932"/>
<text x="72" y="356" font-family="Segoe UI, Arial, sans-serif" font-size="25" fill="#655E57">An AI virtual creator: slow mornings,</text>
<text x="72" y="392" font-family="Segoe UI, Arial, sans-serif" font-size="25" fill="#655E57">sketchbooks, and weekend adventures</text>
<text x="72" y="428" font-family="Segoe UI, Arial, sans-serif" font-size="25" fill="#655E57">that inspire our original designs.</text>
<text x="72" y="540" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" fill="#B94716">mikaday.store/meet-mika</text>
</svg>`);
  await sharp(panel)
    .composite([{ input: photo, left: W - photoW, top: 0 }, { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${aiTag(W - photoW + 20, H - 54)}</svg>`), left: 0, top: 0 }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile("public/og/meet-mika.jpg");
  console.log("og/meet-mika.jpg");
}

// 3. Square logo for schema.org Organization (Google wants a raster image, at least 112px).
await sharp("src/app/icon.svg", { density: 900 }).resize(512, 512).png().toFile("public/brand/logo.png");
console.log("brand/logo.png");
for (const f of fs.readdirSync("public/og")) console.log(" ", f, (fs.statSync(`public/og/${f}`).size / 1024).toFixed(0) + "KB");
