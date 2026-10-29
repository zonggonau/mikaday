"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type ContactState = { ok?: boolean; error?: string };

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.email("Please enter a valid email address.").max(254),
  orderNumber: z.string().trim().max(40).default(""),
  message: z.string().trim().min(10, "Please write a little more (at least 10 characters).").max(5000),
});

export async function sendContactMessage(_previous: ContactState, formData: FormData): Promise<ContactState> {
  // Honeypot: real visitors never fill this hidden field.
  if (String(formData.get("website") ?? "")) return { ok: true };
  if (!rateLimit(`contact:${clientIp(await headers())}`, 5, 10 * 60_000)) {
    return { error: "Too many messages. Please try again in a few minutes." };
  }

  const parsed = schema.safeParse({
    name: formData.get("name") ?? "",
    email: String(formData.get("email") ?? "").trim(),
    orderNumber: formData.get("orderNumber") ?? "",
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  await db.contactMessage.create({
    data: { ...parsed.data, orderNumber: parsed.data.orderNumber || null },
  });
  return { ok: true };
}
