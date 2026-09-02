import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, hasDb, schema } from "@/lib/db";
import { authorLink, cleanOutcome } from "@/lib/outcomes";
import { hoursOf, isEffort } from "@/lib/toll";
import { newSlug } from "@/lib/slug";
import { checkGate, looksLikeBot } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const trim = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: "Not configured yet." }, { status: 503 });

  const body = await req.json().catch(() => ({}));

  /* Honeypot first: a bot that filled the hidden field gets the same shape of
     response as a success, so it learns nothing and stops retrying. */
  if (looksLikeBot({ trap: body.trap, startedAt: body.startedAt })) {
    return NextResponse.json({ ok: true });
  }

  const gate = await checkGate(req);
  if (!gate.ok) {
    return NextResponse.json(
      {
        error:
          gate.reason === "ip"
            ? "You have already sent a few today. Come back tomorrow."
            : "The wall has taken all it can today. Come back tomorrow.",
      },
      { status: 429 },
    );
  }

  const feature = trim(body.feature, 120);
  const summary = trim(body.summary, 900);
  const lesson = trim(body.lesson, 500) || null;
  const outcome = cleanOutcome(body.outcome, body.outcome_other);

  const author = trim(body.author, 60) || null;
  const author_url = authorLink(body.author_url)?.url ?? null;

  /* Checked here, not only in the browser. The form is the polite path; this
     is the one that holds. */
  if (feature.length < 3) return NextResponse.json({ error: "Say what you built." }, { status: 400 });
  if (summary.length < 20)
    return NextResponse.json({ error: "A line or two about what happened to it." }, { status: 400 });
  if (!outcome)
    return NextResponse.json(
      { error: "Pick what happened to it, or describe it in a few words." },
      { status: 400 },
    );

  /* Clamped, not trusted. Someone typing 9999 people for 9999 weeks would own
     the leaderboard for ever, and the whole point of the ranking is that it
     means something. */
  const clamp = (v: unknown, lo: number, hi: number, dflt: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
  };
  const people = clamp(body.people, 1, 200, 1);
  const weeks = clamp(body.weeks, 1, 520, 1);
  const effort = isEffort(body.effort) ? body.effort : "evenings";
  const hours = hoursOf(people, weeks, effort);
  const spend = body.spend === "" || body.spend == null ? null : clamp(body.spend, 0, 100_000_000, 0);

  const image_url = typeof body.image_url === "string" && body.image_url.startsWith("https://")
    ? body.image_url.slice(0, 500)
    : null;

  try {
    const slug = newSlug();
    await db().insert(schema.graves).values({
      feature, summary, lesson, outcome, author, author_url, image_url, slug,
      time_spent: weeks >= 52 ? `${(weeks / 52).toFixed(1)} years` : `${weeks} weeks`,
      people, weeks, effort, hours, spend,
      seeded: false,
      status: "pending", // nothing reaches the wall unread
    });
    /* The slug goes back immediately, before moderation. The plot is theirs
       from the moment they bury — that is the whole point of route two. The
       page itself says it is awaiting review. */
    const [row] = await db().select({ id: schema.graves.id })
      .from(schema.graves).where(eq(schema.graves.slug, slug)).limit(1);
    return NextResponse.json({ ok: true, slug, id: row?.id ?? null, hours });
  } catch (e) {
    console.error("[submit] insert failed", e);
    return NextResponse.json({ error: "That did not save. Try again in a moment." }, { status: 500 });
  }
}
