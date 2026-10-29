"use client";

import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import type { ActionResult } from "@/app/admin/actions";

const variants = {
  primary: "bg-ink text-white hover:bg-ink-soft",
  accent: "bg-primary text-white hover:bg-primary-hover",
  secondary: "border border-line bg-white hover:border-ink",
  danger: "border border-danger/30 bg-white text-danger hover:bg-danger-soft",
};

export function ActionButton({
  action,
  children,
  variant = "secondary",
  confirm,
}: {
  action: () => Promise<ActionResult>;
  children: ReactNode;
  variant?: keyof typeof variants;
  confirm?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  return (
    <div className="inline-flex flex-col items-start gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          startTransition(async () => setResult(await action()));
        }}
        className={`rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 ${variants[variant]}`}
      >
        {pending ? "Memproses…" : children}
      </button>
      {result && (
        <p className={`max-w-md text-xs ${result.ok ? "text-success" : "text-danger"}`}>{result.message}</p>
      )}
    </div>
  );
}

export function Toggle({
  checked,
  action,
  label,
}: {
  checked: boolean;
  action: (next: boolean) => Promise<ActionResult>;
  label: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic(checked);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={optimistic}
        aria-label={label}
        title={error ?? label}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const next = !optimistic;
            setOptimistic(next);
            const result = await action(next);
            setError(result.ok ? null : result.message);
          })
        }
        className={`relative h-6 w-11 rounded-full transition disabled:opacity-60 ${
          optimistic ? "bg-success" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition ${
            optimistic ? "translate-x-5" : ""
          }`}
        />
      </button>
      {error && <p className="max-w-48 text-xs text-danger">{error}</p>}
    </div>
  );
}
