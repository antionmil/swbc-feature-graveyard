import "server-only";

/**
 * Real font bytes for satori.
 *
 * ImageResponse cannot use a CSS font-family — it needs the file. Google serves
 * woff2 to a modern user-agent, which satori cannot read, so we ask as an old
 * browser to get a TTF back.
 *
 * The retry matters: the promise used to be memoised whether or not it resolved
 * to anything, so ONE bad fetch from Google left that lambda instance serving
 * glyphless images until it was recycled — and the CDN then held them for an
 * hour. An empty result is forgotten so the next request tries again.
 */
const CSS = "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;600&display=swap";

let cache: Promise<Map<number, ArrayBuffer>> | null = null;

async function load() {
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
    // A font failure must never take down an image — but it must not stick either.
  }
  return out;
}

export async function ogFonts() {
  if (!cache) cache = load();
  const got = await cache;
  if (got.size === 0) cache = null;
  return got;
}

/** satori needs at least one face or it throws, which would serve a 500 to an
 *  unfurler. Falls back to whichever weight did load. */
export function faceList(faces: Map<number, ArrayBuffer>) {
  const bold = faces.get(600) ?? faces.get(400);
  const book = faces.get(400) ?? faces.get(600);
  if (!bold || !book) return [];
  return [
    { name: "Inter Tight", data: book, weight: 400 as const, style: "normal" as const },
    { name: "Inter Tight", data: bold, weight: 600 as const, style: "normal" as const },
  ];
}
