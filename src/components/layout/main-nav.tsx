"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNav } from "./nav-links";

const linkClass =
  "relative inline-flex h-11 items-center text-sm font-medium text-foreground/80 transition-colors hover:text-foreground";

/** Static links: the prerendered fallback while the pathname is resolved. */
export function MainNavFallback() {
  return (
    <>
      {mainNav.map((item) => (
        <Link key={item.href} href={item.href} className={linkClass}>
          {item.label}
        </Link>
      ))}
    </>
  );
}

export function MainNav() {
  const pathname = usePathname();
  return (
    <>
      {mainNav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              linkClass,
              active && "text-foreground after:absolute after:inset-x-0 after:bottom-2 after:h-0.5 after:rounded-full after:bg-brand",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
