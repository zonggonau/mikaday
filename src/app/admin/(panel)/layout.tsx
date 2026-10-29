import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "../actions";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: "Admin", template: `%s · Admin ${site.name}` },
  robots: { index: false, follow: false },
};

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Produk" },
  { href: "/admin/orders", label: "Pesanan" },
  { href: "/admin/journal", label: "Jurnal" },
  { href: "/admin/messages", label: "Pesan" },
  { href: "/admin/settings", label: "Pengaturan" },
];

// Each page verifies the session itself (requireAdmin) because layouts do not re-run on navigation.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-screen flex-col bg-paper lg:flex-row">
      <aside className="border-b border-line bg-white lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-5 py-4 lg:block lg:py-6">
          <Link href="/admin" className="font-semibold">
            {site.name}
            <span className="text-brand">.</span> <span className="text-sm font-normal text-muted-foreground">admin</span>
          </Link>
          <Link href="/" className="text-xs text-muted-foreground hover:text-ink lg:mt-1 lg:block">
            Lihat toko ↗
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-lg px-3 py-2 text-sm text-ink-soft transition hover:bg-paper hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="hidden px-3 pt-6 lg:block">
          <button type="submit" className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-paper hover:text-ink">
            Keluar
          </button>
        </form>
      </aside>
      <div className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        {/* Centered, capped width so pages don't stretch on wide monitors. */}
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </div>
    </div>
  );
}
