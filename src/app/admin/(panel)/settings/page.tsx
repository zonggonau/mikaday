import type { Metadata } from "next";
import { Suspense } from "react";
import { ActionButton } from "@/components/admin/action-button";
import { AdminLoading, Card, Notice, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { env } from "@/lib/env";
import { paypal, PAYPAL_WEBHOOK_EVENTS } from "@/lib/paypal";
import { printful, PRINTFUL_WEBHOOK_TYPES, type PfWebhookConfig } from "@/lib/printful";
import { site } from "@/lib/site";
import { registerPrintfulWebhook, sendTestEmail } from "../../actions";

export const metadata: Metadata = { title: "Pengaturan" };

function maskSecret(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has("secret")) parsed.searchParams.set("secret", "••••••");
    return decodeURIComponent(parsed.toString());
  } catch {
    return url;
  }
}

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <code className="block overflow-x-auto rounded-lg bg-paper px-3 py-2 text-xs whitespace-nowrap">{value}</code>
    </div>
  );
}

async function Settings() {
  await requireAdmin();

  const errorText = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);
  const [webhookResult, paypalResult] = await Promise.allSettled([
    printful.getWebhooks(),
    env.paypalConfigured ? paypal.ping() : Promise.resolve(),
  ]);
  const webhook: PfWebhookConfig | null = webhookResult.status === "fulfilled" ? webhookResult.value : null;
  const printfulError =
    webhookResult.status === "rejected" ? errorText(webhookResult.reason, "Tidak bisa menghubungi Printful.") : null;
  const paypalError =
    paypalResult.status === "rejected" ? errorText(paypalResult.reason, "Tidak bisa menghubungi PayPal.") : null;

  const expectedBase = `${site.url}/api/printful/webhook`;
  let webhookMatches = false;
  try {
    const current = webhook?.url ? new URL(webhook.url) : null;
    webhookMatches =
      !!current &&
      `${current.origin}${current.pathname}` === expectedBase &&
      current.searchParams.get("secret") === env.webhookSecret;
  } catch {}
  const missingTypes = PRINTFUL_WEBHOOK_TYPES.filter((t) => !(webhook?.types ?? []).includes(t));
  const secretIsApiKey = env.webhookSecret === env.printfulApiKey;
  const publicSite = site.url.startsWith("https://") && !/localhost|127\.0\.0\.1/.test(site.url);

  const config = [
    { label: "PRINTFUL_API_KEY", ok: !printfulError, note: printfulError ?? "Terhubung" },
    {
      label: "NEXT_PUBLIC_PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET",
      ok: env.paypalConfigured && !paypalError,
      note: !env.paypalConfigured
        ? "Belum diisi — tombol pembayaran tidak akan muncul"
        : (paypalError ?? `Terhubung (mode ${env.paypalMode})`),
    },
    {
      label: "PAYPAL_MODE",
      ok: true,
      note: env.paypalMode === "live" ? "live — pembayaran sungguhan" : "sandbox — uji coba, tidak ada uang sungguhan",
    },
    {
      label: "PAYPAL_WEBHOOK_ID",
      ok: Boolean(env.paypalWebhookId),
      note: env.paypalWebhookId ? "Terisi" : "Belum diisi — refund/pembayaran tertunda dari PayPal tidak tercatat otomatis",
    },
    {
      label: "SYNC_WEBHOOK_SECRET",
      ok: !secretIsApiKey,
      note: secretIsApiKey ? "Sama dengan PRINTFUL_API_KEY — ganti dengan string acak, lalu daftarkan ulang webhook" : "OK",
    },
    {
      label: "PRINTFUL_AUTO_CONFIRM",
      ok: true,
      note: env.printfulAutoConfirm ? "true — order langsung diproduksi" : "false — order masuk sebagai draft, konfirmasi manual",
    },
    { label: "NEXT_PUBLIC_SITE_URL", ok: publicSite, note: publicSite ? site.url : `${site.url} — webhook butuh domain publik HTTPS` },
    {
      label: "SMTP_HOST / EMAIL_FROM",
      ok: env.emailConfigured,
      note: env.emailConfigured
        ? `${env.smtp.host}:${env.smtp.port} · dari ${env.emailFrom}`
        : "Belum diisi — email ke pelanggan tidak dikirim",
    },
    {
      label: "CRON_SECRET",
      ok: Boolean(env.cronSecret),
      note: env.cronSecret ? "Terisi" : "Belum diisi — email \"paket sampai\" & pengiriman ulang email tidak berjalan",
    },
  ];

  return (
    <>
      <PageHeader title="Pengaturan" description="Status konfigurasi dan integrasi webhook." />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Konfigurasi (.env)">
          <ul className="divide-y divide-line text-sm">
            {config.map((c) => (
              <li key={c.label} className="flex gap-3 py-2.5">
                <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-xs text-white ${c.ok ? "bg-success" : "bg-danger"}`}>
                  {c.ok ? "✓" : "!"}
                </span>
                <div>
                  <p className="font-mono text-xs">{c.label}</p>
                  <p className="text-muted-foreground">{c.note}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Webhook Printful">
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Printful memberi tahu toko saat paket dikirim (nomor resi), order gagal, atau produk diubah. Hanya
              satu URL webhook yang aktif per toko Printful.
            </p>
            <CopyRow label="Terdaftar sekarang" value={maskSecret(webhook?.url ?? null) ?? "(belum ada)"} />
            {webhook && webhook.types.length > 0 && <p className="text-xs text-muted-foreground">Event: {webhook.types.join(", ")}</p>}
            {webhookMatches && missingTypes.length === 0 ? (
              <Notice tone="success">Webhook sudah benar.</Notice>
            ) : (
              <Notice>
                {webhookMatches ? `Event yang belum aktif: ${missingTypes.join(", ")}.` : `Webhook belum mengarah ke ${expectedBase}.`}
              </Notice>
            )}
            <ActionButton
              action={registerPrintfulWebhook}
              variant="primary"
              confirm={`Daftarkan ${expectedBase}?secret=… sebagai webhook Printful? Ini menggantikan webhook yang ada.`}
            >
              Daftarkan / perbarui webhook
            </ActionButton>
          </div>
        </Card>

        <Card title="Email pelanggan" className="xl:col-span-2">
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Pelanggan otomatis menerima email saat <b>pembayaran berhasil</b>, saat <b>paket dikirim</b> (kurir, nomor resi,
              link lacak), dan saat <b>paket sampai</b>. Status &quot;sampai&quot; dicek ke Printful setiap 30 menit lewat{" "}
              <code>/api/cron/orders</code>. Setiap email hanya terkirim sekali; riwayatnya ada di halaman detail pesanan.
            </p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Isi <code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code> dari penyedia email
                (mis. Brevo, Resend, Zoho, Hostinger Mail) dan <code>EMAIL_FROM</code>, mis.{" "}
                <code>{`${site.name} <orders@${site.url.replace(/^https?:\/\//, "")}>`}</code>.
              </li>
              <li>Verifikasi domain pengirim di penyedia email (record SPF & DKIM di DNS) agar email tidak masuk spam.</li>
              <li>
                Balasan pelanggan dikirim ke <code>EMAIL_REPLY_TO</code> (default: <code>NEXT_PUBLIC_SUPPORT_EMAIL</code>
                {env.emailReplyTo ? <> — sekarang <b>{env.emailReplyTo}</b></> : <> — belum diisi, balasan ke alamat pengirim</>}).
              </li>
            </ol>
            <ActionButton action={sendTestEmail} variant="primary">
              Tes SMTP & kirim email contoh ke {env.adminEmail}
            </ActionButton>
          </div>
        </Card>

        <Card title="Pengaturan PayPal" className="xl:col-span-2">
          <ol className="list-decimal space-y-4 pl-5 text-sm">
            <li>
              Buka <b>developer.paypal.com → Apps & Credentials</b>, pilih tab <b>Sandbox</b> (uji coba) atau <b>Live</b>,
              buat app, lalu salin <i>Client ID</i> ke <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> dan <i>Secret</i> ke{" "}
              <code>PAYPAL_CLIENT_SECRET</code>. Set <code>PAYPAL_MODE</code> ke <code>sandbox</code> atau <code>live</code> sesuai tab.
            </li>
            <li>
              Di app yang sama, bagian <b>Webhooks → Add Webhook</b>, isi URL berikut dan centang event-event di bawahnya:
              <CopyRow label="Webhook URL" value={`${site.url}/api/paypal/webhook`} />
              <p className="mt-2 text-muted-foreground">Event: {PAYPAL_WEBHOOK_EVENTS.join(", ")}</p>
            </li>
            <li>
              Salin <i>Webhook ID</i> yang muncul ke <code>PAYPAL_WEBHOOK_ID</code>, lalu restart server.
            </li>
            <li>
              Mata uang toko: <b>{site.currency}</b>. Untuk uji coba, bayar dengan akun <i>Personal</i> sandbox dari menu{" "}
              <b>Sandbox → Accounts</b>, atau tombol kartu dengan nomor kartu uji PayPal.
            </li>
          </ol>
        </Card>
      </div>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Settings />
    </Suspense>
  );
}
