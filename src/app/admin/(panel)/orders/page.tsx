import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ORDER_STATUS_LABELS, StatusBadge } from "@/components/admin/status-badge";
import { AdminLoading, Notice, PageHeader } from "@/components/admin/ui";
import type { OrderStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Pesanan" };

const ATTENTION: OrderStatus[] = ["FAILED", "DRAFT", "ON_HOLD", "RECEIVED"];

async function OrderList({ searchParams }: Pick<PageProps<"/admin/orders">, "searchParams">) {
  await requireAdmin();
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const q = typeof params.q === "string" ? params.q.trim() : "";

  // Unpaid checkouts (buyer left before paying) are hidden unless explicitly filtered.
  const statusFilter =
    status === "attention"
      ? { status: { in: ATTENTION } }
      : status in ORDER_STATUS_LABELS
        ? { status: status as OrderStatus }
        : { status: { not: "PENDING_PAYMENT" as const } };

  const orders = await db.order.findMany({
    where: {
      ...statusFilter,
      ...(q
        ? {
            OR: [
              { invoiceNumber: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
              { customerName: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <PageHeader
        title="Pesanan"
        description='Pesanan yang sudah dibayar lewat PayPal dan status fulfillment di Printful. Checkout yang belum dibayar ada di filter "Belum dibayar".'
      />

      <form className="mb-5 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari invoice, email, nama…"
          className="min-w-60 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <select name="status" defaultValue={status} className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
          <option value="">Semua status</option>
          <option value="attention">Perlu tindakan</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">Filter</button>
      </form>

      {orders.length === 0 ? (
        <Notice tone="info">Belum ada pesanan{status || q ? " yang cocok dengan filter" : ""}.</Notice>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Pelanggan</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-paper">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-primary">
                      {o.invoiceNumber}
                    </Link>
                    {o.mode === "sandbox" && <span className="ml-2 rounded bg-line px-1.5 text-xs">Sandbox</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    {o.customerName || "—"}
                    <span className="block text-xs text-muted-foreground">{o.email}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{o._count.items}</td>
                  <td className="px-4 py-3">{formatMoney(Number(o.total), o.currency)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                    {o.paymentStatus && o.paymentStatus !== "COMPLETED" && (
                      <span className="block text-xs text-muted-foreground">PayPal: {o.paymentStatus}</span>
                    )}
                    {o.printfulStatus && <span className="block text-xs text-muted-foreground">Printful: {o.printfulStatus}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <OrderList searchParams={searchParams} />
    </Suspense>
  );
}
