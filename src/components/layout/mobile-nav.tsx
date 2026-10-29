"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { AiBadge } from "@/components/brand/ai-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { site } from "@/lib/site";
import { helpNav, mainNav } from "./nav-links";

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="gap-0 bg-background p-0 data-[side=left]:w-[min(88vw,22rem)]">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="font-serif text-lg tracking-[0.18em]">{site.name}</SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col overflow-y-auto px-3 py-3">
          {mainNav.map((item) => (
            <SheetClose asChild key={item.href}>
              <Link href={item.href} className="flex h-12 items-center rounded-lg px-3 text-base font-medium hover:bg-secondary">
                {item.label}
              </Link>
            </SheetClose>
          ))}
          <Separator className="my-3" />
          {helpNav.map((item) => (
            <SheetClose asChild key={item.href}>
              <Link href={item.href} className="flex h-11 items-center rounded-lg px-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
                {item.label}
              </Link>
            </SheetClose>
          ))}
          {site.social.length > 0 && (
            <>
              <Separator className="my-3" />
              <p className="px-3 pb-1 text-eyebrow text-muted-foreground">Follow Mika</p>
              {site.social.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center rounded-lg px-3 text-sm hover:bg-secondary"
                >
                  {s.name}
                </a>
              ))}
            </>
          )}
          <div className="px-3 pt-6 pb-4">
            <AiBadge />
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
