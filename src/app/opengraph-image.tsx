import { ImageResponse } from "next/og";
import { totals } from "@/lib/entries";
import { faceList, ogFonts } from "@/lib/ogFonts";

/* The site declared twitter:card=summary_large_image and shipped no image, so
   the URL the whole thing is announced with unfurled as an empty card while
   every individual grave looked right. This is that missing image. */
export const runtime = "nodejs";
export const revalidate = 3600;
export const alt = "Feature Graveyard — things we built that nobody used";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The same headstone silhouettes as the horizon on the site itself. */
const STONES: [number, number, number][] = [
  [64, 84, 0], [148, 62, 1], [228, 96, 0], [312, 70, 2], [396, 88, 0],
  [478, 64, 1], [556, 92, 0], [640, 74, 2], [724, 84, 0], [806, 62, 1],
  [886, 94, 0], [970, 70, 0], [1052, 86, 2], [1132, 66, 1],
];
const GROUND = 104;   // the band the stones stand on
const HORIZON = 210;  // nothing in the text block may reach below this

export default async function Image() {
  const faces = faceList(await ogFonts());
  const sum = await totals().catch(() => ({ graves: 0, hours: 0, weighed: 0, spend: 0 }));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "flex-end", background: "#0e1013", position: "relative",
          fontFamily: "Inter Tight", padding: 72, color: "#e8e6e1",
        }}
      >
        {/* No halo: satori has no radial gradient, so a faint circle renders
            as a flat disc with a hard edge. */}
        <div style={{ position: "absolute", top: 92, right: 132, width: 56, height: 56, borderRadius: 58, background: "#dcd9cd", opacity: 0.6, display: "flex" }} />
        {STONES.map(([x, h, kind], i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: x, bottom: GROUND, width: kind === 1 ? 42 : 56, height: h,
              borderTopLeftRadius: kind === 2 ? 5 : 28, borderTopRightRadius: kind === 2 ? 5 : 28,
              background: "#1a212b", display: "flex",
            }}
          />
        ))}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: GROUND, height: 3, background: "#2f3a26", display: "flex" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: GROUND, background: "#090a06", display: "flex" }} />

        <div style={{ display: "flex", flexDirection: "column", position: "relative", marginBottom: HORIZON }}>
          <div style={{ display: "flex", fontSize: 20, letterSpacing: 6, color: "#8fae9b" }}>
            HERE LIES
          </div>
          <div style={{ display: "flex", fontSize: 86, fontWeight: 600, letterSpacing: -2, marginTop: 12 }}>
            Feature Graveyard
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#9a9da3", marginTop: 16, maxWidth: 860 }}>
            Things we built that nobody used. Register one and you get a plot, a
            certificate and an hour count.
          </div>
          {sum.graves > 0 && (
            <div style={{ display: "flex", fontSize: 23, color: "#7d8794", marginTop: 22 }}>
              {sum.graves} buried · {Math.round(sum.hours / 40).toLocaleString()} full-time weeks
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts: faces },
  );
}
