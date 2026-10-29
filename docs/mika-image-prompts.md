# Mika — image prompts

The site currently uses original SVG illustrations in `public/images/` (labelled "Illustration").
Use these prompts to create photographic versions later with an AI image tool. Generate the
**portrait first** and use it as the character reference for every other image so Mika stays consistent.

## How to swap an image

1. Save the file in `public/images/` (JPG or WebP, at least the size listed below).
2. In the matching content file, change `src` to the new file and set `kind: "photo"`.
   Keep `conceptual: true` — the site then labels it "AI-generated lifestyle image".
3. Check that the Mountain Sunset Mug looks like the real product (black mug, same artwork and
   placement). If it doesn't, don't use the image.

## Character reference (paste into every prompt)

> Mika, a 28-year-old American woman, natural approachable features, chin-length dark brown bob with a
> soft side part, distinctive translucent amber-orange round glasses, warm brown eyes, friendly smile,
> natural skin texture, understated makeup. Relaxed tasteful clothing in cream, black and earthy tones.
> Candid editorial lifestyle photography, soft natural window light, warm neutral palette
> (cream #FAF7F2, sand #F1EBE3, charcoal #242424, accent orange #E87932), 35mm, shallow depth of field,
> no text, no logos.

## Prompts

| File | Used in | Ratio / min size | Prompt (after the character reference) |
| --- | --- | --- | --- |
| `hero.jpg` | `src/content/home.ts` → `hero.image` | 4:5 · 1200×1500 | In her warm creative home studio in Portland, sitting at a wooden desk, holding a black ceramic mug with a mountain-sunset illustration (layered ridges, low orange sun, cream river) toward the camera at chest height, plants and a window behind her, morning light. |
| `portrait.jpg` | `src/content/mika.ts` → `portrait` | 4:5 · 1200×1500 | Head-and-shoulders portrait, cream knit sweater, plain warm sand background, looking at the camera with a soft smile. |
| `workspace.jpg` | `src/content/mika.ts` → `workspace` | 4:3 · 1600×1200 | Sketching in a pocket sketchbook at her sunlit desk, laptop open, the black mountain-sunset mug beside her with light steam, black top. |
| `shop-the-moment.jpg` | `src/content/home.ts` → `shopTheMoment.image` | 5:4 · 1500×1200 | Overhead view of her wooden desk mid-sketch: open sketchbook with a pencil mountain drawing, her hand holding an orange pencil, the black mountain-sunset mug clearly visible, headphones, a coffee. |
| `journal-slow-morning.jpg` | `src/content/journal.ts` (slow morning) | 16:9 · 1920×1080 (keep the subject centered) | No person. Morning desk by a window: pour-over coffee kettle, the black mountain-sunset mug with steam, open sketchbook, small plant. |
| `journal-sketch.jpg` | `src/content/journal.ts` (sketch behind) | 16:9 · 1920×1080 | No person. Close-up of rough pencil sketches of layered mountains, a sun and a winding river on cream paper, with orange, sand, brown and charcoal color swatches and a pencil. |
| `journal-pack.jpg` | `src/content/journal.ts` (what I pack) | 16:9 · 1920×1080 | No person. Flat lay on a café table: natural canvas tote bag, pocket sketchbook, two pens, black headphones, a coffee to go. |

## Rules (from the brand brief)

- Mika is an AI character; never present the images as photos of a real person.
- The mug must keep its real shape, artwork, print placement and proportions; product pages use the
  real Printful mockups for purchase decisions.
- Don't show the unreleased Tee, Tote or Hoodie as if they were for sale.
