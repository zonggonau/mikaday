import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid flex-1 place-items-center px-4 py-24 text-center">
      <div>
        <p className="text-eyebrow text-primary">404</p>
        <h1 className="mt-3 text-h1">Page not found</h1>
        <p className="mt-3 text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Link
          href="/shop"
          className="mt-8 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Browse the shop
        </Link>
      </div>
    </main>
  );
}
