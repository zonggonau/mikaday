import type { MikaProfile } from "./types";

export const mika: MikaProfile = {
  name: "Mika",
  age: 28,
  hometown: "Portland, Oregon",
  role: "AI virtual creator",
  shortBio:
    "Mika is a fictional freelance designer from Portland who loves good coffee, quiet mornings, simple everyday style, and getting out of town on the weekend.",
  bio: [
    "Mika is a virtual creator — an AI character with her own small, fictional world. In that world she is 28, lives in Portland, Oregon, and works as a freelance designer from a sunny corner desk crowded with sketchbooks and half-finished coffee.",
    "Her days follow a familiar rhythm: a slow morning, a few hours of focused work, a walk to clear her head, and plenty of time for the small things that make a day feel like hers. On weekends she trades the desk for trails, rivers, and long drives with no particular plan.",
    "The designs at MIKADAY are inspired by that rhythm. Mika's stories are fiction, created to share a mood and a point of view. The products are real — original MIKADAY designs, printed to order and shipped from our fulfillment partner.",
  ],
  interests: [
    {
      title: "Coffee, slowly",
      body: "Mornings start with a pour-over and no rush. Coffee is less about caffeine and more about a few quiet minutes before the day gets loud.",
    },
    {
      title: "Illustration",
      body: "Loose sketches, layered landscapes, and warm, earthy palettes. Most ideas start as a doodle in the margin of something else.",
    },
    {
      title: "Everyday style",
      body: "Cream, black, and earthy tones. Comfortable pieces that work at the desk, on a walk, and at the coffee shop after.",
    },
    {
      title: "Weekend adventures",
      body: "Mountain views, river trails, and small towns along the way. Never a big itinerary — just enough to come back with new ideas.",
    },
  ],
  portrait: {
    src: "/images/mika/mika-portrait.jpg",
    kind: "photo",
    alt: "Portrait of Mika, a woman with a chin-length dark brown bob, freckles, and amber-orange glasses, in a cream sweater, smiling softly.",
    brief: "Portrait of Mika — chin-length dark brown bob, translucent amber-orange glasses, cream top, natural light.",
    conceptual: true,
    position: "50% 30%",
  },
  workspace: {
    src: "/images/mika/mika-breakfast-mug.jpg",
    kind: "photo",
    alt: "Mika at her kitchen table in morning light, resting her chin on her hand with coffee in the black Mountain Sunset Mug.",
    brief: "A slow morning in Mika's world: breakfast, sunlight, and the black Mountain Sunset Mug.",
    conceptual: true,
    position: "50% 24%",
  },
  disclosure:
    "Mika is an AI virtual creator. Her lifestyle stories are fictional; the products are real items sold by MIKADAY.",
};
