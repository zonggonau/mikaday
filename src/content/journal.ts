import type { JournalArticle } from "./types";

/**
 * Sample stories, imported into the database from Admin → Jurnal ("Impor artikel contoh").
 * After import, articles are managed in the admin panel — editing this file no longer changes the site.
 */
export const articles: JournalArticle[] = [
  {
    slug: "a-slow-morning-at-my-desk",
    title: "A Slow Morning at My Desk",
    category: "Everyday",
    excerpt: "Coffee first, inbox later. The small routine that makes the rest of the day feel lighter.",
    publishedAt: "2026-10-26",
    cover: {
      src: "/images/journal-slow-morning.svg",
      kind: "illustration",
      alt: "Illustration of a sunlit desk with a pour-over kettle, a sketchbook, and the black Mountain Sunset Mug.",
      brief: "Mika's desk in morning light — sketchbook open, pencils, the black Mountain Sunset Mug.",
      conceptual: true,
    },
    body: [
      { type: "p", text: "I have a rule for weekday mornings: nothing with a notification gets my attention until the first cup of coffee is gone. It sounds small, but it changes the whole tone of the day." },
      { type: "p", text: "The routine is simple. Kettle on. Beans ground. A pour-over that takes longer than it needs to. While it drips, I open the sketchbook to a blank page and draw whatever is in front of me — the window, the plant that refuses to die, the steam coming off the mug." },
      { type: "h2", text: "Why the sketchbook comes before the laptop" },
      { type: "p", text: "Client work is about solving someone else's problem. The morning page is about noticing things for myself. Ten minutes of drawing with no goal is the best warm-up I've found for the hours of focused work that follow." },
      { type: "p", text: "Most of those sketches go nowhere. A few become something bigger. The mountain on my favorite mug started exactly like this — a doodle next to a coffee ring." },
      { type: "h2", text: "Keeping it slow" },
      { type: "p", text: "Slow doesn't mean late. It means the first hour of the day belongs to me, and the rest of the day can have whatever is left. Usually that's more than enough." },
    ],
    productIds: ["487047783"],
  },
  {
    slug: "the-sketch-behind-mountain-sunset",
    title: "The Sketch Behind Mountain Sunset",
    category: "Design notes",
    excerpt: "Three ridgelines, one low sun, and a river that took eleven tries. How the collection's illustration came together.",
    publishedAt: "2026-10-19",
    cover: {
      src: "/images/journal-sketch.svg",
      kind: "illustration",
      alt: "Illustration of a sketchbook with pencil sketches of layered mountains, the finished Mountain Sunset artwork, and color swatches.",
      brief: "Close-up of rough pencil sketches for the Mountain Sunset illustration, with orange color swatches.",
      conceptual: true,
    },
    body: [
      { type: "p", text: "Every design I love starts as something I almost threw away. Mountain Sunset was a margin doodle: three layered ridges and a circle sitting a little too low. I kept coming back to it." },
      { type: "h2", text: "Finding the shapes" },
      { type: "p", text: "The ridgelines came easily. The river did not. It took eleven versions to find a curve that led your eye into the valley without stealing attention from the sun. The final one is barely more than a single ribbon of cream." },
      { type: "p", text: "I kept the shapes bold on purpose. A design that lives on everyday objects has to read from across a room, not just up close." },
      { type: "h2", text: "Choosing the colors" },
      { type: "p", text: "The palette is the one I keep returning to: a warm orange for the sun, charcoal for the mountains, and cream for the light in between. It is the color of the last twenty minutes before the sun drops behind a ridge — my favorite part of any drive." },
      { type: "p", text: "The collection starts with a mug, because that's where my mornings start. More pieces are in the works." },
    ],
    productIds: ["487047783"],
  },
  {
    slug: "what-i-pack-for-a-creative-afternoon",
    title: "What I Pack for a Creative Afternoon",
    category: "Style",
    excerpt: "Leaving the desk behind for a few hours? Here's the short list that always comes along.",
    publishedAt: "2026-10-12",
    cover: {
      src: "/images/journal-pack.svg",
      kind: "illustration",
      alt: "Illustration of a flat lay: a canvas tote, sketchbook, pens, headphones, and a coffee to go.",
      brief: "Flat lay of Mika's afternoon kit on a café table — sketchbook, pens, headphones, coffee.",
      conceptual: true,
    },
    body: [
      { type: "p", text: "Some afternoons the desk feels too small. When that happens I pack a bag, walk to a café or a park bench, and give myself a few hours to think somewhere new." },
      { type: "h2", text: "The short list" },
      { type: "p", text: "A pocket sketchbook and two pens — one fine, one thick. Headphones, mostly for the quiet. A light layer, because Portland weather has opinions. And coffee, either bought on the way or brought from home." },
      { type: "p", text: "That's it. The point is to carry less, so there's room to notice more." },
      { type: "h2", text: "Dressing for a day with no plan" },
      { type: "p", text: "I keep it to neutrals — cream, black, and something earthy — so everything works together and nothing needs a second thought. Comfortable enough to sit for hours, put together enough to say yes to whatever the afternoon turns into." },
    ],
    productIds: ["487047783"],
  },
];
