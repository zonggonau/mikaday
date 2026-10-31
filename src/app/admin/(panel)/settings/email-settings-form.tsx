"use client";

import { useActionState, useState } from "react";
import type { ActionResult } from "@/app/admin/actions";
import { preservingSubmit } from "@/lib/use-preserving-form";

const field = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-ink";
const label = "grid gap-1 text-sm font-medium";
const hint = "text-xs font-normal text-muted-foreground";

type Security = "ssl" | "starttls";

const PRESETS: Record<string, { label: string; host?: string; port?: number; security?: Security }> = {
  gmail: { label: "Gmail", host: "smtp.gmail.com", port: 465, security: "ssl" },
  brevo: { label: "Brevo", host: "smtp-relay.brevo.com", port: 587, security: "starttls" },
  zoho: { label: "Zoho Mail", host: "smtp.zoho.com", port: 465, security: "ssl" },
  hostinger: { label: "Hostinger Mail", host: "smtp.hostinger.com", port: 465, security: "ssl" },
  custom: { label: "Lainnya (isi sendiri)" },
};

const presetFor = (host: string) =>
  Object.entries(PRESETS).find(([, p]) => p.host && p.host === host.toLowerCase())?.[0] ?? (host ? "custom" : "gmail");

export interface EmailSettingsDefaults {
  host: string;
  port: number;
  security: Security;
  user: string;
  hasPassword: boolean;
  fromName: string;
  fromEmail: string;
  replyTo: string;
}

export function EmailSettingsForm({
  action,
  defaults,
}: {
  action: (previous: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  defaults: EmailSettingsDefaults;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [preset, setPreset] = useState(presetFor(defaults.host));
  const [host, setHost] = useState(defaults.host);
  const [port, setPort] = useState(String(defaults.port));
  const [security, setSecurity] = useState<Security>(defaults.security);
  const [user, setUser] = useState(defaults.user);
  const [fromEmail, setFromEmail] = useState(defaults.fromEmail);

  const gmail = preset === "gmail";
  const fromMismatch = gmail && user && fromEmail && user.trim().toLowerCase() !== fromEmail.trim().toLowerCase();

  function choosePreset(key: string) {
    setPreset(key);
    const p = PRESETS[key];
    if (p.host) setHost(p.host);
    if (p.port) setPort(String(p.port));
    if (p.security) setSecurity(p.security);
  }

  return (
    <form onSubmit={preservingSubmit(formAction)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Penyedia email
          <select value={preset} onChange={(e) => choosePreset(e.target.value)} className={field}>
            {Object.entries(PRESETS).map(([key, p]) => (
              <option key={key} value={key}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-[1fr_6rem] gap-3">
          <label className={label}>
            Host SMTP
            <input
              name="host"
              required
              value={host}
              onChange={(e) => {
                setHost(e.target.value);
                setPreset(presetFor(e.target.value));
              }}
              className={field}
            />
          </label>
          <label className={label}>
            Port
            <input name="port" required inputMode="numeric" value={port} onChange={(e) => setPort(e.target.value)} className={field} />
          </label>
        </div>
        <label className={label}>
          Keamanan
          <select name="security" value={security} onChange={(e) => setSecurity(e.target.value as Security)} className={field}>
            <option value="ssl">SSL/TLS (biasanya port 465)</option>
            <option value="starttls">STARTTLS (biasanya port 587)</option>
          </select>
        </label>
        <label className={label}>
          Username
          <input
            name="user"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="off"
            placeholder={gmail ? "mikadaylife@gmail.com" : ""}
            className={field}
          />
          {gmail && <span className={hint}>Alamat Gmail lengkap.</span>}
        </label>
        <label className={`${label} sm:col-span-2`}>
          {gmail ? "App Password" : "Password"}
          <input
            name="pass"
            type="password"
            autoComplete="new-password"
            placeholder={defaults.hasPassword ? "•••••••• tersimpan — kosongkan untuk tetap memakai" : gmail ? "16 karakter dari Google" : ""}
            className={field}
          />
          <span className={hint}>Disimpan terenkripsi dan tidak pernah ditampilkan lagi.</span>
        </label>
        <label className={label}>
          Nama pengirim
          <input name="fromName" defaultValue={defaults.fromName} maxLength={80} className={field} />
        </label>
        <label className={label}>
          Email pengirim
          <input
            name="fromEmail"
            type="email"
            required
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder={gmail ? user || "mikadaylife@gmail.com" : "orders@mikaday.store"}
            className={field}
          />
          {gmail && <span className={hint}>Untuk Gmail, sama dengan username.</span>}
        </label>
        <label className={`${label} sm:col-span-2`}>
          Email untuk balasan pelanggan (opsional)
          <input name="replyTo" type="email" defaultValue={defaults.replyTo} className={field} />
          <span className={hint}>Kosong = balasan masuk ke email pengirim.</span>
        </label>
      </div>

      {gmail && (
        <div className="rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink-soft">
          <p className="font-medium text-ink">Memakai Gmail</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>
              Aktifkan <b>2-Step Verification</b> di akun Google (myaccount.google.com → Security).
            </li>
            <li>
              Buat App Password di{" "}
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                myaccount.google.com/apppasswords
              </a>{" "}
              (nama bebas, mis. &quot;MIKADAY&quot;), lalu tempel 16 karakternya di kolom App Password.
            </li>
            <li>Batas Gmail pribadi sekitar 500 email per hari.</li>
          </ol>
        </div>
      )}
      {fromMismatch && (
        <p className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          Gmail hanya mengirim atas nama {user}. Samakan email pengirim, atau daftarkan alamat lain sebagai alias &quot;Send mail as&quot; di
          Gmail.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-soft disabled:opacity-60"
        >
          {pending ? "Menyimpan…" : "Simpan pengaturan email"}
        </button>
        {state && <p className={`text-sm ${state.ok ? "text-success" : "text-danger"}`}>{state.message}</p>}
      </div>
    </form>
  );
}
