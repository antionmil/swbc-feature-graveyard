import { NextResponse, type NextRequest } from "next/server";
import { db, hasDb, schema } from "@/lib/db";
import { cleanOutcome } from "@/lib/outcomes";
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
  const summary = trim(body.summary, 600);
  const outcome = cleanOutcome(body.outcome, body.outcome_other);
  const time_spent = trim(body.time_spent, 40) || null;
  const author = trim(body.author, 60) || null;

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

  const image_url = typeof body.image_url === "string" && body.image_url.startsWith("https://")
    ? body.image_url.slice(0, 500)
    : null;

  try {
    const slug = newSlug();
    await db().insert(schema.graves).values({
      feature, summary, outcome, time_spent, author, image_url, slug,
      seeded: false,
      status: "pending", // nothing reaches the wall unread
    });
    /* The slug goes back immediately, before moderation. The plot is theirs
       from the moment they bury — that is the whole point of route two. The
       page itself says it is awaiting review. */
    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    console.error("[submit] insert failed", e);
    return NextResponse.json({ error: "That did not save. Try again in a moment." }, { status: 500 });
  }
}
