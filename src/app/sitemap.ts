import type { MetadataRoute } from "next";
import { wall } from "@/lib/entries";

const SITE = "https://featuregraveyard.onedaybuilt.com";
export const revalidate = 3600;

/** Approved plots only — `wall()` already filters on status, so nothing
 *  unreviewed is ever advertised to a crawler. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await wall().catch(() => []);
  return [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/lessons`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/heaviest`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE}/bury`, changeFrequency: "monthly", priority: 0.6 },
    ...rows.map((g) => ({
      url: `${SITE}/g/${g.slug}`,
      lastModified: g.created_at ? new Date(g.created_at) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
