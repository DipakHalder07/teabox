import type { MetadataRoute } from "next";

// Keep private pages out of search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/checkout", "/order/", "/pay-review/", "/account/"],
    },
  };
}
