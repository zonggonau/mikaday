import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-secondary" aria-hidden>
        <Icon className="size-6 text-muted-foreground" />
      </span>
      <h2 className="mt-4 text-h3">{title}</h2>
      {children && <div className="mt-2 max-w-md text-muted-foreground">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
  id,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-eyebrow text-primary">{eyebrow}</p>}
        <h2 id={id} className="mt-2 text-h2">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
