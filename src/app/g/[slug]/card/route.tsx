import { ImageResponse } from "next/og";
import { grave, heavierThan, stoneCount, slugs } from "@/lib/entries";
import { isSlug } from "@/lib/slug";
import { faceList, ogFonts } from "@/lib/ogFonts";
import { bigHours, compare, registry } from "@/lib/toll";

export const runtime = "nodejs";
export const revalidate = 3600;

/* Without this the segment is server-rendered on every request, whatever
   `revalidate` says — see the note on `slugs` in lib/entries.ts. */
export async function generateStaticParams() {
  return slugs();
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) return new Response("Not found", { status: 404 });

  const g = await grave(slug);
  if (!g) return new Response("Not found", { status: 404 });
  /* No certificate for something nobody has read. The plot page still exists
     for whoever buried it; a signed-looking image on the owner's domain does
     not. */
  if (g.status !== "approved") return new Response("Not found", { status: 404 });

  const [{ total }, pct] = await Promise.all([stoneCount(g.id), heavierThan(g.hours ?? 0)]);
  const faces = faceList(await ogFonts());
  /* satori throws with an empty font list, and a throw here is a 500 served to
     whatever is unfurling the link. Better a text unfurl than a broken one. */
  if (faces.length === 0) return new Response("Not found", { status: 404 });

  const people = g.people ?? 1;
  const h = bigHours(g.hours ?? 0, people);
  const line = (t: string, c: string, size: number, mt = 0) => (
    <div style={{ display: "flex", fontSize: size, color: c, marginTop: mt }}>{t}</div>
  );

  /* A certificate, not a banner. The border, the rule under the header and the
     registry number in the corner are doing the work — this is the thing that
     lands in a Slack channel, and it has to look like a document somebody
     filed rather than a marketing card. */
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 630, display: "flex", padding: 26,
          background: "#0e1013", fontFamily: "Inter Tight",
        }}
      >
        <div
          style={{
            display: "flex", flexDirection: "column", flexGrow: 1,
            border: "2px solid #2b3138", borderRadius: 6, padding: "42px 52px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            {line("CERTIFICATE OF DEATH", "#8fae9b", 22)}
            {line(registry(g.id), "#565d66", 20)}
          </div>
          <div style={{ display: "flex", height: 2, background: "#2b3138", marginTop: 16 }} />

          <div style={{ display: "flex", flexGrow: 1, flexDirection: "column", justifyContent: "center" }}>
            {line(g.outcome.toUpperCase(), "#6d7075", 20)}
            <div
              style={{
                display: "flex", marginTop: 14, fontFamily: "Inter Tight", fontWeight: 600,
                fontSize: g.feature.length > 42 ? 50 : 64, lineHeight: 1.08, color: "#e8e6e1",
              }}
            >
              {g.feature.length > 84 ? g.feature.slice(0, 81) + "…" : g.feature}
            </div>

            <div style={{ display: "flex", alignItems: "baseline", marginTop: 30 }}>
              <div style={{ display: "flex", fontSize: 84, fontFamily: "Inter Tight", fontWeight: 600, color: "#8fae9b" }}>{h.n}</div>
              <div style={{ display: "flex", fontSize: 30, color: "#9a9da3", marginLeft: 16 }}>{h.unit}</div>
            </div>
            {line(compare(g.hours ?? 0, people), "#6d7075", 24, 12)}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 21, color: "#565d66" }}>
            <div style={{ display: "flex" }}>
              {total} {total === 1 ? "stone" : "stones"}
              {g.spend ? `  ·  $${g.spend.toLocaleString()} spent` : ""}
              {pct !== null ? `  ·  heavier than ${pct}%` : ""}
            </div>
            {line("featuregraveyard.onedaybuilt.com", "#454b53", 21)}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: faces,
      headers: { "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" },
    },
  );
}
