import type { OrderStatus } from "@/generated/prisma/enums";

const styles: Record<OrderStatus, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "Belum dibayar", className: "bg-line text-muted-foreground" },
  RECEIVED: { label: "Dibayar", className: "bg-blue-50 text-blue-700" },
  DRAFT: { label: "Draft Printful", className: "bg-warning-soft text-warning" },
  PROCESSING: { label: "Diproduksi", className: "bg-blue-50 text-blue-700" },
  ON_HOLD: { label: "Ditahan", className: "bg-warning-soft text-warning" },
  PARTIAL: { label: "Terkirim sebagian", className: "bg-success-soft text-success" },
  SHIPPED: { label: "Dikirim", className: "bg-success-soft text-success" },
  RETURNED: { label: "Dikembalikan", className: "bg-danger-soft text-danger" },
  REFUNDED: { label: "Refund", className: "bg-line text-muted-foreground" },
  CANCELED: { label: "Dibatalkan", className: "bg-line text-muted-foreground" },
  FAILED: { label: "Gagal", className: "bg-danger-soft text-danger" },
};

export const ORDER_STATUS_LABELS = Object.fromEntries(
  Object.entries(styles).map(([status, s]) => [status, s.label]),
) as Record<OrderStatus, string>;

export function StatusBadge({ status }: { status: OrderStatus }) {
  const style = styles[status];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${style.className}`}>
      {style.label}
    </span>
  );
}
