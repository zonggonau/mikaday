import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Nobody may frame the site (clickjacking on the admin). PayPal's iframes inside our pages are unaffected.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    // Printful mockups and catalog images
    remotePatterns: [
      { protocol: "https", hostname: "files.cdn.printful.com" },
      { protocol: "https", hostname: "*.printful.com" },
    ],
    // Site illustrations and images uploaded in the admin panel.
    localPatterns: [
      { pathname: "/images/**", search: "" },
      { pathname: "/media/**", search: "" },
    ],
  },
  experimental: {
    // Journal cover uploads (max 4 MB) go through a Server Action; Vercel caps request bodies at 4.5 MB.
    serverActions: { bodySizeLimit: "4.5mb" },
  },
  async redirects() {
    // The storefront moved from /products to /shop; keep old links working.
    return [
      { source: "/products", destination: "/shop", permanent: true },
      { source: "/products/:slug", destination: "/shop/:slug", permanent: true },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
