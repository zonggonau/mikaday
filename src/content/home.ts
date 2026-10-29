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
    src: "/images/mika/mika-breakfast.jpg",
    kind: "photo",
    alt: "Mika, with a dark brown bob and amber-orange glasses, at a sunny kitchen table holding a black mug, with avocado toast and berries.",
    brief: "Mika at breakfast in morning light, holding the black Mountain Sunset Mug.",
    conceptual: true,
    position: "50% 40%",
  },
};

/** "Shop the Moment": a lifestyle scene and the real products that appear in it. */
export const shopTheMoment: { title: string; text: string; image: ImageAsset; productIds: string[] } = {
  title: "Shop the moment",
  text: "Late morning on the porch: the rain has just stopped, the garden smells green, and there's coffee in the mug that started a collection.",
  image: {
    src: "/images/mika/mika-porch-coffee.jpg",
    kind: "photo",
    alt: "Mika in a cream sweater and black jeans sitting on a wooden porch bench, holding a black mug with both hands, surrounded by plants.",
    brief: "Mika on the porch after the rain, the black Mountain Sunset Mug in her hands.",
    conceptual: true,
    position: "50% 28%",
  },
  productIds: ["487047783"],
};
