import { FileWarning } from "lucide-react";
import type { ReactNode } from "react";
import type { PolicyPage } from "@/content/types";

export function PolicyView({ policy, aside }: { policy: PolicyPage; aside?: ReactNode }) {
  return (
    <div className={aside ? "grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px]" : ""}>
      <article className="max-w-[68ch]">
        <h1 className="text-h1">{policy.title}</h1>
        {policy.draft && (
          <p className="mt-6 flex gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning" role="note">
            <FileWarning className="size-5 shrink-0" aria-hidden />
            <span>
              <strong>Draft policy.</strong> This page is a working draft pending the store owner&apos;s final business and fulfillment
              rules. It has not been legally reviewed.
            </span>
          </p>
        )}
        <p className="mt-6 text-lead text-muted-foreground">{policy.intro}</p>
        {policy.sections.map((s) => (
          <section key={s.heading} className="mt-10">
            <h2 className="text-h3">{s.heading}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">
              {s.body.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </article>
      {aside && <aside className="lg:pt-16">{aside}</aside>}
    </div>
  );
}
