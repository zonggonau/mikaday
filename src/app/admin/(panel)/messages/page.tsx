import type { Metadata } from "next";
import { Suspense } from "react";
import { Toggle } from "@/components/admin/action-button";
import { AdminLoading, Notice, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { setMessageHandled } from "../../actions";

export const metadata: Metadata = { title: "Pesan" };

async function MessageList({ searchParams }: Pick<PageProps<"/admin/messages">, "searchParams">) {
  await requireAdmin();
  const { show } = await searchParams;
  const showAll = show === "all";
  const messages = await db.contactMessage.findMany({
    where: showAll ? {} : { handled: false },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <PageHeader
        title="Pesan"
        description="Pesan dari formulir Contact di toko. Balas lewat email pengirim, lalu tandai selesai."
        actions={
          <a href={showAll ? "/admin/messages" : "/admin/messages?show=all"} className="rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium hover:border-ink">
            {showAll ? "Hanya yang belum selesai" : "Tampilkan semua"}
          </a>
        }
      />
      {messages.length === 0 ? (
        <Notice tone="info">{showAll ? "Belum ada pesan." : "Tidak ada pesan yang menunggu balasan."}</Notice>
      ) : (
        <ul className="space-y-4">
          {messages.map((m) => (
            <li key={m.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: your message to MIKADAY${m.orderNumber ? ` (${m.orderNumber})` : ""}`)}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {m.email}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(m.createdAt)}
                    {m.orderNumber && ` · Order ${m.orderNumber}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Selesai</span>
                  <Toggle checked={m.handled} action={setMessageHandled.bind(null, m.id)} label="Tandai selesai" />
                </div>
              </div>
              <p className="mt-4 text-sm whitespace-pre-line">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function AdminMessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <MessageList searchParams={searchParams} />
    </Suspense>
  );
}
