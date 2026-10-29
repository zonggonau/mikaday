import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
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
    // Journal cover uploads (max 4 MB) go through a Server Action.
    serverActions: { bodySizeLimit: "5mb" },
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
