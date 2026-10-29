import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-start gap-3">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-5 ${className}`}>
      {title && <h2 className="mb-4 font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function Notice({ tone = "warning", children }: { tone?: "warning" | "danger" | "success" | "info"; children: ReactNode }) {
  const tones = {
    warning: "border-warning/30 bg-warning-soft text-warning",
    danger: "border-danger/30 bg-danger-soft text-danger",
    success: "border-success/30 bg-success-soft text-success",
    info: "border-line bg-paper text-ink-soft",
  };
  return <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}

export function AdminLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-8 w-48 rounded bg-line" />
      <div className="h-4 w-80 rounded bg-line" />
      <div className="h-64 rounded-2xl bg-line/70" />
    </div>
  );
}
