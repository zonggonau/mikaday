"use server";

import { refresh, updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  checkAdminCredentials,
  createAdminSession,
  destroyAdminSession,
  requireAdmin,
} from "@/lib/auth";
import { PRODUCTS_TAG } from "@/lib/catalog";
import { refundOrder } from "@/lib/checkout";
import { db } from "@/lib/db";
import { orderConfirmedEmail } from "@/lib/email-templates";
import { env } from "@/lib/env";
import { explainMailError, sendMail, verifyMailer } from "@/lib/mailer";
import { resendOrderEmail, type OrderEmailKind } from "@/lib/order-emails";
import {
  cancelPrintfulOrder,
  confirmPrintfulOrder,
  refreshPrintfulOrder,
  submitOrderToPrintful,
} from "@/lib/orders";
import { printful, PRINTFUL_WEBHOOK_TYPES } from "@/lib/printful";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { site } from "@/lib/site";
import { seal } from "@/lib/secret-box";
import { syncProductDetails, syncProductList, syncPublishedProductDetails } from "@/lib/sync";

export interface ActionResult {
  ok: boolean;
  message: string;
}

const fail = (error: unknown): ActionResult => ({
  ok: false,
  message: error instanceof Error ? error.message : "Terjadi kesalahan.",
});

/** Storefront data changed: expire the catalog cache and re-render the admin page. */
function productsChanged() {
  updateTag(PRODUCTS_TAG);
  refresh();
}

// ---------- Session ----------

export async function login(_previous: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  if (!rateLimit(`login:${clientIp(await headers())}`, 5, 15 * 60_000)) {
    return { error: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." };
  }
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!checkAdminCredentials(email, password)) {
    return { error: "Email atau password salah." };
  }
  await createAdminSession();
  redirect("/admin");
}

export async function logout() {
  await destroyAdminSession();
  redirect("/admin/login");
}

// ---------- Products ----------

export async function syncCatalog(): Promise<ActionResult> {
  await requireAdmin();
  try {
    const list = await syncProductList();
    const details = await syncPublishedProductDetails();
    productsChanged();
    const failed = details.failed.length ? ` Gagal: ${details.failed.join(", ")}.` : "";
    return {
      ok: details.failed.length === 0,
      message: `${list.total} produk di Printful (${list.created} baru, ${list.removed} dihapus). Detail ${details.synced} produk aktif diperbarui.${failed}`,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function setProductPublished(productId: string, published: boolean): Promise<ActionResult> {
  await requireAdmin();
  try {
    const id = BigInt(productId);
    if (published) {
      // Variants, prices and mockups are only fetched for products that are actually sold.
      const product = await db.product.findUniqueOrThrow({ where: { id } });
      if (product.deletedAt) {
        return { ok: false, message: "Produk ini sudah dihapus dari Printful dan tidak bisa dijual. Klik “Sinkron ulang” bila produknya dibuat lagi." };
      }
      if (!product.detailsSyncedAt) await syncProductDetails(id);
      const sellable = await db.variant.count({ where: { productId: id, enabled: true } });
      if (sellable === 0) {
        return { ok: false, message: "Produk ini tidak punya varian aktif yang bisa dijual." };
      }
    }
    await db.product.update({ where: { id }, data: { published } });
    productsChanged();
    return { ok: true, message: published ? "Produk ditampilkan di toko." : "Produk disembunyikan." };
  } catch (error) {
    return fail(error);
  }
}

export async function setProductFeatured(productId: string, featured: boolean): Promise<ActionResult> {
  await requireAdmin();
  try {
    await db.product.update({ where: { id: BigInt(productId) }, data: { featured } });
    productsChanged();
    return { ok: true, message: featured ? "Ditandai unggulan." : "Tidak lagi unggulan." };
  } catch (error) {
    return fail(error);
  }
}

export async function resyncProduct(productId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const result = await syncProductDetails(productId);
    productsChanged();
    return result.deleted
      ? { ok: false, message: "Produk sudah dihapus dari Printful dan disembunyikan." }
      : { ok: true, message: `${result.variants} varian diperbarui dari Printful.` };
  } catch (error) {
    return fail(error);
  }
}

export async function setVariantEnabled(variantId: string, enabled: boolean): Promise<ActionResult> {
  await requireAdmin();
  try {
    await db.variant.update({ where: { id: BigInt(variantId) }, data: { enabled } });
    productsChanged();
    return { ok: true, message: enabled ? "Varian dijual." : "Varian disembunyikan." };
  } catch (error) {
    return fail(error);
  }
}

const productSchema = z.object({
  title: z.string().trim().max(200),
  description: z.string().trim().max(10_000),
  sortOrder: z.coerce.number().int().min(-10_000).max(10_000),
});

export async function updateProduct(
  productId: string,
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    sortOrder: formData.get("sortOrder") ?? 0,
  });
  if (!parsed.success) return { ok: false, message: "Periksa kembali isian formulir." };
  try {
    await db.product.update({
      where: { id: BigInt(productId) },
      data: {
        title: parsed.data.title || null,
        description: parsed.data.description || null,
        sortOrder: parsed.data.sortOrder,
      },
    });
    productsChanged();
    return { ok: true, message: "Perubahan disimpan." };
  } catch (error) {
    return fail(error);
  }
}

// ---------- Orders ----------

export async function runOrderAction(
  orderId: string,
  action: "submit" | "confirm" | "cancel" | "refresh" | "refund",
): Promise<ActionResult> {
  await requireAdmin();
  try {
    switch (action) {
      case "refund":
        await refundOrder(orderId);
        break;
      case "submit":
        await submitOrderToPrintful(orderId);
        break;
      case "confirm":
        await confirmPrintfulOrder(orderId);
        break;
      case "cancel":
        await cancelPrintfulOrder(orderId);
        break;
      case "refresh":
        await refreshPrintfulOrder(orderId);
        break;
    }
    refresh();
    const messages = {
      submit: "Order dikirim ke Printful.",
      confirm: "Order dikonfirmasi — Printful mulai memproduksi.",
      cancel: "Order dibatalkan di Printful.",
      refresh: "Status diperbarui dari Printful.",
      refund: "Dana dikembalikan ke pembeli lewat PayPal. Order Printful dibatalkan jika belum diproduksi.",
    };
    return { ok: true, message: messages[action] };
  } catch (error) {
    refresh();
    return fail(error);
  }
}

// ---------- Settings ----------

export async function registerPrintfulWebhook(): Promise<ActionResult> {
  await requireAdmin();
  // Printful allows only one webhook URL per store; never replace it with one Printful cannot reach.
  if (!site.url.startsWith("https://") || /localhost|127\.0\.0\.1/.test(site.url)) {
    return {
      ok: false,
      message: `NEXT_PUBLIC_SITE_URL (${site.url}) bukan domain publik HTTPS. Webhook hanya bisa didaftarkan dari situs yang sudah online.`,
    };
  }
  try {
    const url = `${site.url}/api/printful/webhook?secret=${encodeURIComponent(env.webhookSecret)}`;
    await printful.setWebhooks({ url, types: PRINTFUL_WEBHOOK_TYPES });
    refresh();
    return { ok: true, message: "Webhook Printful terdaftar." };
  } catch (error) {
    return fail(error);
  }
}

// ---------- Contact messages ----------

export async function setMessageHandled(messageId: string, handled: boolean): Promise<ActionResult> {
  await requireAdmin();
  try {
    await db.contactMessage.update({ where: { id: messageId }, data: { handled } });
    refresh();
    return { ok: true, message: handled ? "Ditandai selesai." : "Ditandai belum selesai." };
  } catch (error) {
    return fail(error);
  }
}

// ---------- Customer emails ----------

export async function sendCustomerEmail(orderId: string, kind: OrderEmailKind, shipmentId?: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const result = await resendOrderEmail(kind, orderId, shipmentId ? BigInt(shipmentId) : null);
    refresh();
    return { ok: true, message: `Email terkirim ke ${result.to}.` };
  } catch (error) {
    refresh();
    return fail(error);
  }
}

/** Checks the SMTP login, then sends a sample order confirmation to the admin address. */
export async function sendTestEmail(): Promise<ActionResult> {
  await requireAdmin();
  try {
    await verifyMailer();
    const product = await db.product.findFirst({
      where: { published: true, deletedAt: null },
      select: { name: true, title: true, thumbnailUrl: true, variants: { select: { retailPrice: true }, take: 1 } },
    });
    const price = Number(product?.variants[0]?.retailPrice ?? 25);
    const sample = orderConfirmedEmail({
      invoiceNumber: "ORD-1000",
      customerName: "Mika Sample",
      currency: site.currency,
      subtotal: price,
      shippingTotal: 5,
      total: price + 5,
      shippingMethodName: "Flat Rate",
      address: { name: "Mika Sample", address1: "123 Example Street", city: "Los Angeles", state: "CA", zip: "90001", country: "US" },
      items: [{ name: product?.title || product?.name || "Sample product", variant: null, quantity: 1, unitPrice: price, imageUrl: product?.thumbnailUrl ?? null }],
    });
    await sendMail({ to: env.adminEmail, ...sample, subject: `[Contoh] ${sample.subject}` });
    return { ok: true, message: `SMTP OK — email contoh terkirim ke ${env.adminEmail}. Cek juga folder Spam.` };
  } catch (error) {
    return { ok: false, message: explainMailError(error) };
  }
}

// ---------- Email (SMTP) settings ----------

const MAIL_FIELDS: Record<string, string> = {
  host: "Host SMTP",
  port: "Port",
  security: "Keamanan",
  user: "Username",
  pass: "Password",
  fromName: "Nama pengirim",
  fromEmail: "Email pengirim",
  replyTo: "Email untuk balasan",
};

const mailSettingsSchema = z.object({
  host: z.string().trim().min(3).max(200).regex(/^[a-z0-9.-]+$/i),
  port: z.coerce.number().int().min(1).max(65535),
  security: z.enum(["ssl", "starttls"]),
  user: z.string().trim().max(254),
  pass: z.string().max(500),
  fromName: z.string().trim().max(80),
  fromEmail: z.email().max(254),
  replyTo: z.union([z.literal(""), z.email().max(254)]),
});

export async function saveMailSettings(_previous: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = mailSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return { ok: false, message: `${MAIL_FIELDS[field] ?? "Data"} tidak valid.` };
  }
  const data = parsed.data;
  const gmail = /(^|\.)(gmail|googlemail)\.com$/i.test(data.host);
  // Google shows App Passwords in groups of four; the spaces are not part of it.
  const pass = gmail ? data.pass.replace(/\s+/g, "") : data.pass;

  const existing = await db.mailSettings.findUnique({ where: { id: 1 }, select: { passEncrypted: true } });
  if (data.user && !pass && !existing?.passEncrypted) {
    return { ok: false, message: gmail ? "Isi App Password Gmail (16 karakter)." : "Isi password SMTP." };
  }
  const name = data.fromName.replace(/["<>]/g, "");
  const values = {
    host: data.host.toLowerCase(),
    port: data.port,
    secure: data.security === "ssl",
    user: data.user,
    from: name ? `${name} <${data.fromEmail}>` : data.fromEmail,
    replyTo: data.replyTo || null,
    // An empty password field keeps the stored one.
    ...(pass ? { passEncrypted: seal(pass) } : {}),
  };
  await db.mailSettings.upsert({ where: { id: 1 }, create: { id: 1, ...values }, update: values });
  refresh();

  const warning =
    gmail && data.user && data.fromEmail.toLowerCase() !== data.user.toLowerCase()
      ? ` Perhatian: dengan Gmail, email pengirim harus sama dengan username (${data.user}) kecuali sudah didaftarkan sebagai alias "Send mail as" di Gmail.`
      : "";
  return { ok: true, message: `Pengaturan email disimpan.${warning} Klik "Tes koneksi" untuk memeriksa login.` };
}

export async function testMailConnection(): Promise<ActionResult> {
  await requireAdmin();
  try {
    const config = await verifyMailer();
    return { ok: true, message: `Login SMTP berhasil: ${config.user || "(tanpa login)"} di ${config.host}:${config.port}. Tidak ada email yang dikirim.` };
  } catch (error) {
    return { ok: false, message: explainMailError(error) };
  }
}

export async function deleteMailSettings(): Promise<ActionResult> {
  await requireAdmin();
  await db.mailSettings.deleteMany({ where: { id: 1 } });
  refresh();
  return {
    ok: true,
    message: env.emailConfigured ? "Pengaturan dihapus — kembali memakai SMTP dari .env." : "Pengaturan dihapus — email ke pelanggan tidak dikirim.",
  };
}
