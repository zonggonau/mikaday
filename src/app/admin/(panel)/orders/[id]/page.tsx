import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment, Suspense } from "react";
import { ActionButton } from "@/components/admin/action-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdminLoading, Card, Notice, PageHeader } from "@/components/admin/ui";
import type { ShippingAddress } from "@/lib/address";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, formatMoney } from "@/lib/format";
import { ORDER_EMAIL_LABELS, type OrderEmailKind } from "@/lib/order-emails";
import { runOrderAction, sendCustomerEmail } from "../../../actions";

export const metadata: Metadata = { title: "Detail pesanan" };

const EMAIL_STATUS: Record<string, { label: string; className: string }> = {
  SENT: { label: "Terkirim", className: "text-success" },
  SENDING: { label: "Mengirim…", className: "text-muted-foreground" },
  FAILED: { label: "Gagal", className: "text-danger" },
  SKIPPED: { label: "Tidak dikirim", className: "text-muted-foreground" },
};

const CANCELLABLE = new Set(["draft", "pending", "failed", "onhold"]);

async function OrderDetail({ params }: Pick<PageProps<"/admin/orders/[id]">, "params">) {
  await requireAdmin();
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      shipments: { orderBy: { createdAt: "asc" } },
      emails: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();

  const address = order.shippingAddress as unknown as ShippingAddress;
  const costs = (order.printfulCosts ?? null) as Record<string, string | null> | null;
  const printfulTotal = costs?.total ? Number(costs.total) : null;
  const money = (n: unknown) => formatMoney(Number(n ?? 0), order.currency);

  const paid = order.paymentStatus === "COMPLETED" && order.status !== "REFUNDED";
  const canSubmit = paid && !order.printfulOrderId && order.items.length > 0 && order.status !== "CANCELED";
  const isSandbox = order.mode !== "live";
  const canConfirm = paid && order.printfulStatus === "draft" && !isSandbox;
  const canCancel = Boolean(order.printfulOrderId) && CANCELLABLE.has(order.printfulStatus ?? "");
  const canRefund = Boolean(order.paymentCaptureId) && paid;
  const paypalActivity = order.paymentCaptureId
    ? `https://www.${order.mode === "live" ? "" : "sandbox."}paypal.com/activity/payment/${order.paymentCaptureId}`
    : null;

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-ink">
        ← Semua pesanan
      </Link>
      <div className="mt-3">
        <PageHeader
          title={`Pesanan ${order.invoiceNumber}`}
          description={
            <>
              {formatDateTime(order.createdAt)} · PayPal {order.mode}
              {order.printfulOrderId && <> · Printful #{order.printfulOrderId.toString()}</>}
            </>
          }
          actions={
            <>
              {canSubmit && (
                <ActionButton action={runOrderAction.bind(null, order.id, "submit")} variant="primary">
                  Kirim ke Printful
                </ActionButton>
              )}
              {canConfirm && (
                <ActionButton
                  action={runOrderAction.bind(null, order.id, "confirm")}
                  variant="accent"
                  confirm="Konfirmasi order ini? Printful akan menagih saldo/kartu Anda dan mulai produksi."
                >
                  Konfirmasi & produksi
                </ActionButton>
              )}
              {order.printfulOrderId && (
                <ActionButton action={runOrderAction.bind(null, order.id, "refresh")}>Refresh status</ActionButton>
              )}
              {canCancel && (
                <ActionButton
                  action={runOrderAction.bind(null, order.id, "cancel")}
                  variant="danger"
                  confirm="Batalkan order di Printful? Dana pembeli TIDAK otomatis dikembalikan — gunakan tombol Refund untuk itu."
                >
                  Batalkan di Printful
                </ActionButton>
              )}
              {canRefund && (
                <ActionButton
                  action={runOrderAction.bind(null, order.id, "refund")}
                  variant="danger"
                  confirm={`Refund penuh ${money(order.total)} ke pembeli lewat PayPal? Order Printful ikut dibatalkan jika belum diproduksi. Tindakan ini tidak bisa dibatalkan.`}
                >
                  Refund
                </ActionButton>
              )}
            </>
          }
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge status={order.status} />
        {order.paymentStatus && <span className="text-sm text-muted-foreground">PayPal: {order.paymentStatus}</span>}
        {order.printfulStatus && <span className="text-sm text-muted-foreground">Printful: {order.printfulStatus}</span>}
      </div>

      {order.lastError && (
        <div className="mb-6">
          <Notice tone={order.status === "FAILED" ? "danger" : "warning"}>{order.lastError}</Notice>
        </div>
      )}
      {order.status === "PENDING_PAYMENT" && (
        <div className="mb-6">
          <Notice tone="info">Pembeli memulai checkout tetapi belum menyelesaikan pembayaran. Tidak ada yang perlu dilakukan.</Notice>
        </div>
      )}
      {isSandbox && order.printfulOrderId && (
        <div className="mb-6">
          <Notice tone="info">
            Ini order <b>uji (PayPal sandbox)</b>. Draft di Printful gratis dan tidak bisa dikonfirmasi ke produksi dari sini.
            Setelah selesai menguji, klik &quot;Batalkan di Printful&quot; agar draft tidak menumpuk.
          </Notice>
        </div>
      )}
      {canConfirm && (
        <div className="mb-6">
          <Notice>
            Order ini masih <b>draft</b> di Printful dan belum diproduksi. Periksa alamat & item, lalu klik
            &quot;Konfirmasi & produksi&quot;. Set <code>PRINTFUL_AUTO_CONFIRM=true</code> untuk melewati langkah ini.
          </Notice>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title="Item">
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3 text-sm">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-line bg-paper">
                    {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-contain" />}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-muted-foreground">
                      {[item.variantName, `Qty ${item.quantity}`, `Variant ${item.variantId.toString()}`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <p>{money(Number(item.unitPrice) * item.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
              {[
                ["Subtotal", money(order.subtotal)],
                [`Ongkir (${order.shippingMethodName ?? order.shippingMethod ?? "—"})`, money(order.shippingTotal)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-muted-foreground">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
              <div className="flex justify-between pt-1 font-semibold">
                <dt>Total dibayar</dt>
                <dd>{money(order.total)}</dd>
              </div>
              {printfulTotal !== null && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Biaya Printful</dt>
                    <dd>− {formatMoney(printfulTotal, costs?.currency ?? order.currency)}</dd>
                  </div>
                  <div className="flex justify-between font-semibold text-success">
                    <dt>Estimasi profit (sebelum fee PayPal)</dt>
                    <dd>{money(Number(order.total) - printfulTotal)}</dd>
                  </div>
                </>
              )}
            </dl>
          </Card>

          <Card title="Pengiriman">
            {order.shipments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada paket yang dikirim.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {order.shipments.map((s) => (
                  <li key={s.id.toString()} className="rounded-xl border border-line p-3">
                    <p className="font-medium">{[s.carrier, s.service].filter(Boolean).join(" · ")}</p>
                    <p className="text-muted-foreground">
                      {s.trackingNumber ?? "Tanpa nomor resi"}
                      {s.shippedAt && ` · ${formatDateTime(s.shippedAt)}`}
                    </p>
                    <p className={s.deliveredAt ? "text-success" : "text-muted-foreground"}>
                      {s.deliveredAt
                        ? `Sampai ${formatDateTime(s.deliveredAt)}`
                        : `Belum sampai${s.deliveryStatus ? ` (${s.deliveryStatus})` : ""}`}
                    </p>
                    {s.trackingUrl && (
                      <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Lacak paket ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Email pelanggan">
            {order.emails.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada email untuk pesanan ini.</p>
            ) : (
              <ul className="divide-y divide-line text-sm">
                {order.emails.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                    <div>
                      <p className="font-medium">{ORDER_EMAIL_LABELS[e.kind as OrderEmailKind] ?? e.kind}</p>
                      <p className="text-muted-foreground">
                        {e.to} · {formatDateTime(e.sentAt ?? e.updatedAt)}
                        {e.attempts > 1 && ` · ${e.attempts}× dicoba`}
                      </p>
                      {e.error && <p className="text-danger">{e.error}</p>}
                    </div>
                    <span className={`text-xs font-semibold ${EMAIL_STATUS[e.status]?.className ?? ""}`}>
                      {EMAIL_STATUS[e.status]?.label ?? e.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {paid && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                <ActionButton action={sendCustomerEmail.bind(null, order.id, "order_confirmed", undefined)}>
                  Kirim konfirmasi
                </ActionButton>
                {order.shipments.map((s, i) => (
                  <Fragment key={s.id.toString()}>
                    <ActionButton action={sendCustomerEmail.bind(null, order.id, "shipped", s.id.toString())}>
                      Kirim info resi{order.shipments.length > 1 ? ` #${i + 1}` : ""}
                    </ActionButton>
                    {s.deliveredAt && (
                      <ActionButton action={sendCustomerEmail.bind(null, order.id, "delivered", s.id.toString())}>
                        Kirim info sampai{order.shipments.length > 1 ? ` #${i + 1}` : ""}
                      </ActionButton>
                    )}
                  </Fragment>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Pelanggan">
            <div className="space-y-1 text-sm">
              <p className="font-medium">{order.customerName || "—"}</p>
              <p>
                <a href={`mailto:${order.email}`} className="text-primary hover:underline">
                  {order.email}
                </a>
              </p>
              {(address.phone || order.phone) && <p>{address.phone || order.phone}</p>}
              <address className="pt-3 not-italic text-ink-soft">
                {address.company && <>{address.company}<br /></>}
                {address.address1}
                {address.address2 && <><br />{address.address2}</>}
                <br />
                {[address.city, address.state, address.zip].filter(Boolean).join(", ")}
                <br />
                {address.country}
              </address>
            </div>
          </Card>

          <Card title="Pembayaran PayPal">
            <dl className="space-y-2 text-sm">
              {[
                ["Status", order.paymentStatus ?? "—"],
                ["Dibayar", order.paidAt ? formatDateTime(order.paidAt) : "—"],
                ["Order ID", order.paymentOrderId ?? "—"],
                ["Capture ID", order.paymentCaptureId ?? "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="truncate font-mono text-xs">{value}</dd>
                </div>
              ))}
            </dl>
            {paypalActivity && (
              <a href={paypalActivity} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-primary hover:underline">
                Buka di PayPal ↗
              </a>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

export default function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}
