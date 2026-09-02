import { ImageResponse } from "next/og";
import { grave, stoneCount } from "@/lib/entries";
import { isSlug } from "@/lib/slug";

export const runtime = "nodejs";
export const revalidate = 3600;

/* ImageResponse cannot use a CSS font-family — it needs real bytes. Google
   serves woff2 to a modern user-agent, which satori cannot read, so we ask as
   an old browser to get a TTF back. */
const CSS = "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;600&display=swap";
let cache: Promise<Map<number, ArrayBuffer>> | null = null;

async function fonts() {
  if (!cache) {
    cache = (async () => {
      const out = new Map<number, ArrayBuffer>();
      try {
        const css = await (
          await fetch(CSS, { headers: { "User-Agent": "Mozilla/5.0 (compatible; OneDayBuilt/1.0)" } })
        ).text();
        const faces = [...css.matchAll(/font-weight:\s*(\d+);[\s\S]*?src:\s*url\(([^)]+)\)/g)];
        await Promise.all(
          faces.map(async ([, w, url]) => out.set(Number(w), await (await fetch(url)).arrayBuffer())),
        );
      } catch {
        // A font failure must never take down the card.
      }
      return out;
    })();
  }
  return cache;
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) return new Response("Not found", { status: 404 });

  const g = await grave(slug);
  if (!g) return new Response("Not found", { status: 404 });
  const { total } = await stoneCount(g.id);

  const faces = await fonts();
  const bold = faces.get(600);
  const book = faces.get(400);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 630, display: "flex", flexDirection: "column",
          background: "#131417", padding: "70px 76px", fontFamily: "Book",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: "#6d7075", textTransform: "uppercase" }}>
          Feature Graveyard
        </div>

        <div style={{ display: "flex", flexGrow: 1, flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", fontSize: 20, letterSpacing: 3, color: "#8fae9b", textTransform: "uppercase" }}>
            {g.outcome}
            {g.time_spent ? `  ·  ${g.time_spent}` : ""}
          </div>
          <div
            style={{
              display: "flex", marginTop: 22, fontSize: g.feature.length > 44 ? 54 : 68,
              lineHeight: 1.1, color: "#e8e6e1", fontFamily: "Bold",
            }}
          >
            {g.feature}
          </div>
          <div style={{ display: "flex", marginTop: 26, maxWidth: 960, fontSize: 28, lineHeight: 1.45, color: "#9a9da3" }}>
            {g.summary.length > 190 ? g.summary.slice(0, 187) + "…" : g.summary}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", fontSize: 22, color: "#5d646d" }}>
          <div style={{ display: "flex", alignItems: "flex-end", marginRight: 14 }}>
            {Array.from({ length: Math.min(4, Math.max(1, total)) }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 14 + ((i * 3) % 6), height: 10 + ((i * 2) % 4),
                  borderRadius: 8, background: "#5d646d", marginRight: 5,
                }}
              />
            ))}
          </div>
          {total} {total === 1 ? "stone" : "stones"}  ·  featuregraveyard.onedaybuilt.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        ...(bold ? [{ name: "Bold", data: bold, style: "normal" as const, weight: 600 as const }] : []),
        ...(book ? [{ name: "Book", data: book, style: "normal" as const, weight: 400 as const }] : []),
      ],
      headers: { "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" },
    },
  );
}
