import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActionButton } from "@/components/admin/action-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdminLoading, Card, Notice, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { formatDateTime, formatMoney } from "@/lib/format";
import { site } from "@/lib/site";
import { syncCatalog } from "../actions";

export const metadata: Metadata = { title: "Dashboard" };

async function Dashboard() {
  await requireAdmin();

  const [totalProducts, published, byStatus, recent, revenue] = await Promise.all([
    db.product.count({ where: { deletedAt: null } }),
    db.product.count({ where: { deletedAt: null, published: true } }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
    db.order.findMany({ where: { status: { not: "PENDING_PAYMENT" } }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.order.aggregate({
      where: { mode: "live", paidAt: { not: null }, status: { notIn: ["REFUNDED", "CANCELED"] } },
      _sum: { total: true },
      _count: { _all: true },
    }),
  ]);

  const count = (...statuses: string[]) =>
    byStatus.filter((s) => statuses.includes(s.status)).reduce((n, s) => n + s._count._all, 0);
  const needsAttention = count("FAILED", "DRAFT", "ON_HOLD", "RECEIVED");

  const stats = [
    { label: "Produk dijual", value: `${published} / ${totalProducts}`, href: "/admin/products" },
    { label: "Pesanan (Live)", value: String(revenue._count._all), href: "/admin/orders" },
    { label: "Omzet (Live)", value: formatMoney(Number(revenue._sum.total ?? 0), site.currency), href: "/admin/orders" },
    { label: "Perlu tindakan", value: String(needsAttention), href: "/admin/orders?status=attention" },
  ];

  const setup = [
    { done: totalProducts > 0, label: "Sinkronkan daftar produk dari Printful" },
    { done: published > 0, label: "Pilih produk yang dijual (tombol Tampil di menu Produk)" },
    { done: env.paypalConfigured, label: "Isi NEXT_PUBLIC_PAYPAL_CLIENT_ID dan PAYPAL_CLIENT_SECRET di .env" },
    { done: Boolean(env.paypalWebhookId), label: "Daftarkan webhook PayPal dan isi PAYPAL_WEBHOOK_ID" },
    { done: env.webhookSecret !== env.printfulApiKey, label: "Ganti SYNC_WEBHOOK_SECRET dengan string acak (bukan API key)" },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Ringkasan toko dan pesanan."
        actions={<ActionButton action={syncCatalog} variant="primary">Sinkronkan dari Printful</ActionButton>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl border border-line bg-white p-5 transition hover:border-ink">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card title="Pesanan terbaru">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada pesanan.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-3 py-3 text-sm hover:text-primary">
                    <span className="font-medium">{o.invoiceNumber}</span>
                    <span className="text-muted-foreground">{o.customerName || o.email}</span>
                    {o.mode === "sandbox" && <span className="rounded bg-line px-1.5 text-xs">Sandbox</span>}
                    <span className="ml-auto">{formatMoney(Number(o.total), o.currency)}</span>
                    <StatusBadge status={o.status} />
                    <span className="w-full text-xs text-muted-foreground sm:w-auto">{formatDateTime(o.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Checklist setup">
          <ul className="space-y-3 text-sm">
            {setup.map((item) => (
              <li key={item.label} className="flex gap-3">
                <span className={`grid size-5 shrink-0 place-items-center rounded-full text-xs ${item.done ? "bg-success text-white" : "border border-line"}`}>
                  {item.done ? "✓" : ""}
                </span>
                <span className={item.done ? "text-muted-foreground line-through" : ""}>{item.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <Notice tone="info">
              Panduan webhook PayPal & Printful ada di{" "}
              <Link href="/admin/settings" className="font-medium underline">
                Pengaturan
              </Link>
              .
            </Notice>
          </div>
        </Card>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Dashboard />
    </Suspense>
  );
}
