import { and, eq, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db, hasDb, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

const OK_SID = /^[0-9a-f-]{8,64}$/i;

async function tally(grave: number, sid: string) {
  const [row] = await db()
    .select({
      total: sql<number>`count(*)::int`,
      mine: sql<number>`count(*) filter (where sid = ${sid})::int`,
    })
    .from(schema.stones)
    .where(eq(schema.stones.grave_id, grave));
  return { total: row?.total ?? 0, mine: (row?.mine ?? 0) > 0 };
}

export async function GET(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ total: 0, mine: false });
  const grave = Number(req.nextUrl.searchParams.get("grave"));
  const sid = req.nextUrl.searchParams.get("sid") ?? "";
  if (!Number.isInteger(grave) || !OK_SID.test(sid)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  try {
    return NextResponse.json(await tally(grave, sid));
  } catch (e) {
    console.error("[stones] get failed", e);
    return NextResponse.json({ total: 0, mine: false });
  }
}

export async function POST(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const grave = Number(body.grave);
  const sid = typeof body.sid === "string" ? body.sid : "";
  const on = body.on === true;
  if (!Number.isInteger(grave) || !OK_SID.test(sid)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  try {
    /* One per visitor per grave is enforced by the primary key on
       (grave_id, sid), not by checking first — a check-then-insert races with
       itself and a double tap would leave two stones. */
    if (on) {
      await db().insert(schema.stones).values({ grave_id: grave, sid }).onConflictDoNothing();
    } else {
      await db().delete(schema.stones)
        .where(and(eq(schema.stones.grave_id, grave), eq(schema.stones.sid, sid)));
    }
    return NextResponse.json(await tally(grave, sid));
  } catch (e) {
    console.error("[stones] write failed", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
