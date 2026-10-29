import type { PolicyPage } from "./types";

/**
 * DRAFT policy text. Replace with the store owner's actual business, fulfillment and legal terms.
 * Pages render a visible "Draft" notice while `draft` is true. Do not add invented addresses or company details.
 */
export const policies: PolicyPage[] = [
  {
    slug: "shipping",
    title: "Shipping",
    draft: true,
    intro:
      "Every MIKADAY item is printed to order and shipped by our fulfillment provider. Shipping availability, options, costs, and delivery estimates come directly from that provider and depend on your address and cart.",
    sections: [
      {
        heading: "Production",
        body: ["Items are produced after you place your order. Production time varies by product and is not included in the shipping estimate."],
      },
      {
        heading: "Shipping options and costs",
        body: [
          "Use the estimator on this page, or enter your address at checkout, to see the shipping options available for your destination. You will always see the shipping cost before you pay.",
          "If no options are shown for your address, we are currently unable to ship there.",
        ],
      },
      {
        heading: "Customs, duties, and taxes",
        body: [
          "International orders may be subject to import duties, taxes, or fees charged by the destination country. These are not included in our prices or shipping costs and are the responsibility of the recipient.",
        ],
      },
      {
        heading: "Tracking",
        body: ["When your order ships, you'll receive a tracking number by email. You can also check your order on the Track Order page."],
      },
    ],
  },
  {
    slug: "returns",
    title: "Returns & Exchanges",
    draft: true,
    intro:
      "Because every item is made to order, we cannot accept returns for change of mind or incorrect size selection. We want you to love what you receive, so please check the size guide before ordering.",
    sections: [
      {
        heading: "Damaged, defective, or misprinted items",
        body: [
          "If your item arrives damaged, defective, or misprinted, contact us within 30 days of delivery with your order number and a clear photo of the issue. We will review the request and arrange a replacement or refund where appropriate.",
        ],
      },
      {
        heading: "Wrong address",
        body: ["Please double-check your shipping address at checkout. Orders returned because of an incorrect or incomplete address may require a new shipping fee to be resent."],
      },
      {
        heading: "Cancellations",
        body: ["Orders enter production quickly. Contact us as soon as possible if you need to cancel; we can only cancel orders that have not started production."],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    draft: true,
    intro:
      "This page explains what information MIKADAY collects when you visit the store or place an order, and how it is used. It is a draft pending review.",
    sections: [
      {
        heading: "Information we collect",
        body: [
          "When you place an order: your name, email address, phone number (optional), and shipping address.",
          "When you contact us: your name, email address, and message.",
          "When you browse: basic analytics data about pages visited, if analytics are enabled. Your cart is stored in your own browser.",
        ],
      },
      {
        heading: "How we use it",
        body: [
          "To process, produce, ship, and support your order; to answer your messages; and to understand how the store is used so we can improve it.",
        ],
      },
      {
        heading: "Who we share it with",
        body: [
          "Payment information is entered on PayPal and is never stored by MIKADAY. Your shipping details are shared with our fulfillment provider, Printful, to produce and deliver your order, and with the carrier delivering it.",
        ],
      },
      {
        heading: "Your choices",
        body: ["You can ask us to access, correct, or delete your personal information by contacting us through the Contact page."],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Service",
    draft: true,
    intro: "These terms describe the rules for using the MIKADAY store. They are a draft pending review and may change.",
    sections: [
      {
        heading: "About MIKADAY and Mika",
        body: [
          "MIKADAY owns this storefront and its original designs. Mika is an AI virtual creator; her stories are fictional and are not testimonials or endorsements. Products are produced and fulfilled by Printful; this does not imply an endorsement by Printful.",
        ],
      },
      {
        heading: "Orders and pricing",
        body: [
          "Prices are shown in US dollars. We confirm the final price, shipping, and availability at checkout. We may cancel an order if an item becomes unavailable or a pricing error occurs, in which case you will be refunded.",
        ],
      },
      {
        heading: "Product images",
        body: [
          "Product images are mockups that show the design and placement. Lifestyle images may be AI-generated or conceptual and are labelled where appropriate. Actual colors may vary slightly between screens and print.",
        ],
      },
      {
        heading: "Intellectual property",
        body: ["All MIKADAY designs, illustrations, and content are owned by MIKADAY and may not be reproduced without permission."],
      },
    ],
  },
];
