import Link from "next/link";
import { Suspense } from "react";
import { site } from "@/lib/site";
import { CartButton } from "./cart-button";
import { MainNav, MainNavFallback } from "./main-nav";
import { MobileNav } from "./mobile-nav";
import { SearchDialog } from "./search-dialog";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center gap-2">
        <MobileNav />
        <Link href="/" className="inline-flex h-11 items-center font-serif text-xl font-medium tracking-[0.18em] lg:mr-10" aria-label={`${site.name} home`}>
          {site.name}
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {/* The pathname is unknown while prerendering dynamic routes, so show plain links until it resolves. */}
          <Suspense fallback={<MainNavFallback />}>
            <MainNav />
          </Suspense>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <SearchDialog />
          <CartButton />
        </div>
      </div>
    </header>
  );
}
