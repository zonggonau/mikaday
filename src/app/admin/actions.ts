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
import { env } from "@/lib/env";
import {
  cancelPrintfulOrder,
  confirmPrintfulOrder,
  refreshPrintfulOrder,
  submitOrderToPrintful,
} from "@/lib/orders";
import { printful, PRINTFUL_WEBHOOK_TYPES } from "@/lib/printful";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { site } from "@/lib/site";
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
