import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** Readable identifier shown wherever Mika is presented. */
export function AiBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground",
        className,
      )}
    >
      <Sparkles className="size-3.5 text-primary" aria-hidden />
      AI virtual creator
    </span>
  );
}
