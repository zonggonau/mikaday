import { NextResponse, connection } from "next/server";
import { getCountries } from "@/lib/shipping";

/** Countries (and required states) for the shipping estimator. Loaded lazily by the browser. */
export async function GET() {
  // Resolve at request time so builds never depend on the Printful API being reachable.
  await connection();
  try {
    return NextResponse.json(await getCountries(), {
      headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error("[countries]", error);
    return NextResponse.json({ error: "Countries are temporarily unavailable." }, { status: 502 });
  }
}
