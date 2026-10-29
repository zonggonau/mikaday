import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { quoteShipping, ShippingError } from "@/lib/shipping";
import { site } from "@/lib/site";

const schema = z.object({
  countryCode: z.string().trim().length(2),
  stateCode: z.string().trim().max(10).optional(),
  city: z.string().trim().max(100).optional(),
  zip: z.string().trim().max(20).optional(),
  items: z
    .array(
      z.object({
        variantId: z.string().regex(/^\d+$/),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .min(1)
    .max(50),
});

/** Public shipping estimator used on product pages and the shipping page. */
export async function POST(request: NextRequest) {
  if (!rateLimit(`estimate:${clientIp(request.headers)}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the destination and try again." }, { status: 400 });
  }

  const { items, ...address } = parsed.data;
  try {
    const rates = await quoteShipping(address, items, site.currency);
    return NextResponse.json({ rates });
  } catch (error) {
    if (error instanceof ShippingError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("[shipping-estimate]", error);
    return NextResponse.json({ error: "Shipping rates are temporarily unavailable." }, { status: 502 });
  }
}
