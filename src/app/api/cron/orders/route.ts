import { NextResponse, type NextRequest } from "next/server";
import { safeEqual } from "@/lib/auth";
import { env } from "@/lib/env";
import { retryFailedEmails } from "@/lib/order-emails";
import { refreshOpenOrders, syncDeliveries } from "@/lib/orders";

/**
 * Scheduled order upkeep, called every 30 minutes with `Authorization: Bearer {CRON_SECRET}`
 * (a crontab on the VPS, or Vercel Cron, which sends that header itself):
 * re-reads open orders, detects deliveries (→ "arrived" email) and retries failed emails.
 */
export async function GET(request: NextRequest) {
  const secret = env.cronSecret;
  if (!secret || !safeEqual(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = { refreshOpenOrders, syncDeliveries, retryFailedEmails };
  const results: Record<string, unknown> = {};
  for (const [name, task] of Object.entries(tasks)) {
    try {
      results[name] = await task();
    } catch (error) {
      console.error(`[cron] ${name} failed`, error);
      results[name] = { error: error instanceof Error ? error.message : String(error) };
    }
  }
  return NextResponse.json(results);
}
