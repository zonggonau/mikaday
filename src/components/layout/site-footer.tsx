import { cacheLife } from "next/cache";
import Link from "next/link";
import { CookieSettingsButton } from "@/components/analytics";
import { getMikaProfile } from "@/lib/content";
import { site } from "@/lib/site";
import { STORE_CATEGORIES } from "@/lib/store-categories";
import { helpNav, legalNav } from "./nav-links";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

function Column({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="text-eyebrow text-muted-foreground">{title}</h2>
      <ul className="mt-3 space-y-1">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="inline-flex min-h-9 items-center text-sm hover:text-primary">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function SiteFooter() {
  const mika = await getMikaProfile();
  const shopLinks = [
    { href: "/shop", label: "Shop all" },
    { href: "/collections", label: "Collections" },
    ...STORE_CATEGORIES.map((c) => ({ href: `/shop?category=${c.slug}`, label: c.name })),
  ];
  const mikaLinks = [
    { href: "/meet-mika", label: "Meet Mika" },
    { href: "/journal", label: "Journal" },
  ];

  return (
    <footer className="mt-24 border-t border-border bg-secondary">
      <div className="container-page grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <p className="font-serif text-xl tracking-[0.18em]">{site.name}</p>
          <p className="mt-2 text-sm font-medium">{site.tagline}</p>
          <p className="mt-4 text-sm text-muted-foreground">{mika.disclosure}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Products are printed to order and fulfilled by Printful. Payments are processed securely by PayPal.
          </p>
        </div>
        <Column title="Shop" links={shopLinks} />
        <Column title="Mika" links={[...mikaLinks, ...site.social.map((s) => ({ href: s.url, label: s.name }))]} />
        <Column title="Help" links={[...helpNav, ...legalNav]} />
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>
            © <CopyrightYear /> {site.name}. Original designs. All prices in {site.currency}.
          </p>
          <p className="flex flex-wrap items-center gap-x-4">
            <span>Mika is fictional. MIKADAY products are real.</span>
            {site.gaMeasurementId && <CookieSettingsButton />}
          </p>
        </div>
      </div>
    </footer>
  );
}
