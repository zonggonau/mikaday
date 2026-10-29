"use client";

import { useActionState } from "react";
import { preservingSubmit } from "@/lib/use-preserving-form";
import type { ActionResult } from "@/app/admin/actions";

const field =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-ink";

export function ProductForm({
  action,
  defaults,
}: {
  action: (previous: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  defaults: { name: string; title: string; description: string; sortOrder: number };
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form onSubmit={preservingSubmit(formAction)} className="space-y-4">
      <label className="grid gap-1 text-sm font-medium">
        Judul di toko
        <input name="title" defaultValue={defaults.title} placeholder={defaults.name} maxLength={200} className={field} />
        <span className="text-xs font-normal text-muted-foreground">Kosongkan untuk memakai nama dari Printful.</span>
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Deskripsi
        <textarea name="description" defaultValue={defaults.description} rows={10} className={field} />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Urutan tampil
        <input name="sortOrder" type="number" defaultValue={defaults.sortOrder} className={`${field} max-w-32`} />
        <span className="text-xs font-normal text-muted-foreground">Angka lebih kecil tampil lebih dulu.</span>
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-soft disabled:opacity-60"
        >
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
        {state && <p className={`text-sm ${state.ok ? "text-success" : "text-danger"}`}>{state.message}</p>}
      </div>
    </form>
  );
}
