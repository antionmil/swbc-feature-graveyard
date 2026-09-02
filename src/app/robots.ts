import type { MetadataRoute } from "next";

const SITE = "https://featuregraveyard.onedaybuilt.com";

/* The moderation queue and the API were crawlable, and there was no sitemap.
   /g/ stays open — the plots are the point — but a pending plot carries its own
   noindex, set in that page's metadata. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
