import type { NextConfig } from "next";

// Sent with every page and API response (locally and on Vercel).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
];

const privateHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Plain redirects live here instead of in redirect-only pages, so no page has to render first.
  async redirects() {
    return [
      { source: "/collections", destination: "/collections/all", permanent: false },
      { source: "/order", destination: "/track", permanent: false },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: privateHeaders },
      { source: "/pay-review/:path*", headers: [...privateHeaders, { key: "Referrer-Policy", value: "no-referrer" }] },
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
      { source: "/api/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "in.teabox.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
    ],
  },
  cacheComponents: true,
  partialPrefetching: true,
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
