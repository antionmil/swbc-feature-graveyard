import { sql } from "drizzle-orm";
import { db, hasDb, schema } from "./db";

/* `Number("")` is 0, and `Number("abc")` is NaN — so an env var that exists
   but is empty silently sets the ceiling to zero and rejects every request
   with "come back tomorrow". The site looks broken and nothing logs. Anything
   that is not a positive number falls back to the default. */
function positive(raw: string | undefined, fallback: number) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/* No per-person daily cap on burials. There was one — three a day — and it
   turned a first-time visitor away with "you have already sent a few today",
   which is the worst possible first impression and was wrong besides. Writing
   a burial costs a row, not money, and nothing reaches the wall unread, so the
   thing a cap was protecting against is already handled by moderation.

   What stays is the global daily ceiling, which is not a limit on a person but
   a backstop against a runaway script turning into a bill, and the honeypot,
   which no human ever touches. */
const CEILING = positive(process.env.DAILY_GENERATION_CEILING, 2000);

/* Counters are day-scoped, so yesterday's entries are dead weight. Without
   this the map gained one entry per IP per day and never shed any. */
const memo = new Map<string, number>();
let memoDay = "";
const today = () => new Date().toISOString().slice(0, 10);

export async function ipHash(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip + today()));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);
}

async function bump(bucket: string): Promise<number> {
  const day = today();
  if (!hasDb()) {
    if (memoDay !== day) { memo.clear(); memoDay = day; }
    const n = (memo.get(bucket) ?? 0) + 1;
    memo.set(bucket, n);
    return n;
  }
  // One atomic statement. Two statements would race under concurrency and
  // under-count exactly when the ceiling matters most.
  const rows = await db()
    .insert(schema.events)
    .values({ bucket, day, n: 1 })
    .onConflictDoUpdate({
      target: schema.events.bucket,
      set: { n: sql`${schema.events.n} + 1` },
    })
    .returning({ n: schema.events.n });
  return rows[0]?.n ?? 1;
}

export type Gate = { ok: true } | { ok: false; reason: "ceiling" };

/**
 * One layer: a global daily ceiling, so a front-page day cannot become a
 * surprise bill. Past it the site serves cache only. Build that state now —
 * you will not have time to design it on a viral day.
 */
export async function checkGate(_req: Request): Promise<Gate> {
  const total = await bump(`gen:${today()}`);
  if (total > CEILING) return { ok: false, reason: "ceiling" };
  return { ok: true };
}

/** Honeypot plus a minimum time-on-form. Cheap, no captcha, no third party. */
export function looksLikeBot(form: { trap?: string; startedAt?: number }) {
  if (form.trap) return true;
  if (form.startedAt && Date.now() - form.startedAt < 2000) return true;
  return false;
}
