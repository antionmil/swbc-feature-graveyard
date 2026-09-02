import { sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db, hasDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/** A random id the browser made for itself. Nothing else is accepted and
 *  nothing else is stored. */
const OK = /^[0-9a-f-]{8,64}$/i;

export async function POST(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({});

  const body = await req.json().catch(() => ({}));
  const sid = body.sid;
  const view = body.view === true;
  if (typeof sid !== "string" || !OK.test(sid)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }

  try {
    /* One statement for the write AND all four numbers. Four separate queries
       would be four round trips on a 30-second heartbeat from every open tab,
       and this runs on Neon's HTTP driver where each one is its own request. */
    const r = await db().execute(sql`
      with touch as (
        insert into visitors (sid) values (${sid})
        on conflict (sid) do update set last_seen = now()
        returning 1
      ),
      seen as (
        insert into counters (key, n)
        select 'views', 1 where ${view}
        on conflict (key) do update set n = counters.n + 1
        returning n
      )
      select
        (select count(*) from visitors where last_seen > now() - interval '2 minutes')::int as online,
        (select count(*) from visitors where last_seen > now() - interval '7 days')::int as week,
        (select count(*) from visitors)::int as total,
        coalesce((select n from counters where key = 'views'), 0)::int as views
      from touch limit 1
    `);
    const rows = (r as unknown as { rows?: Record<string, number>[] }).rows ?? (r as unknown as Record<string, number>[]);
    return NextResponse.json(rows[0] ?? {});
  } catch (e) {
    console.error("[pulse] failed", e);
    return NextResponse.json({});
  }
}
