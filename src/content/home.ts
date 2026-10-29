import type { ImageAsset } from "./types";

export const hero: {
  eyebrow: string;
  headline: string;
  text: string;
  image: ImageAsset;
} = {
  eyebrow: "Coffee. Creativity. Everyday adventures.",
  headline: "Make room for the little things.",
  text: "Meet Mika, a virtual creator exploring thoughtful design, slow mornings, and everyday adventures. Discover original pieces inspired by her world.",
  image: {
    src: "/images/hero.svg",
    kind: "illustration",
    alt: "Illustration of Mika, with a dark brown bob and amber-orange glasses, holding a black Mountain Sunset Mug in her workspace.",
    brief: "Mika in her warm creative workspace, holding the black Mountain Sunset Mug.",
    conceptual: true,
  },
};

/** "Shop the Moment": a lifestyle scene and the real products that appear in it. */
export const shopTheMoment: { title: string; text: string; image: ImageAsset; productIds: string[] } = {
  title: "Shop the moment",
  text: "Mid-morning at Mika's desk: a fresh sketch, a playlist on low, and coffee in the mug that started a collection.",
  image: {
    src: "/images/shop-the-moment.svg",
    kind: "illustration",
    alt: "Illustration of Mika's desk from above: an open sketchbook mid-sketch, a coffee, and the black Mountain Sunset Mug.",
    brief: "Mika at her desk mid-sketch, the Mountain Sunset Mug in natural view.",
    conceptual: true,
  },
  productIds: ["487047783"],
};
