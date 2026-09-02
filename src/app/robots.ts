import type { MetadataRoute } from "next";

const SITE = "https://featuregraveyard.onedaybuilt.com";

/* The moderation queue and the API were crawlable, and there was no sitemap.
   /g/ stays open — the plots are the point. A plot the owner has taken down
   404s, so there is nothing there to exclude. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
