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
    /* One statement for the write AND all four numbers — four separate queries
       would be four round trips on a 30-second heartbeat from every open tab,
       and Neon's HTTP driver makes each one its own request.
       
       The counts UNION this visitor in rather than reading the table alone.
       Inside a single statement the sub-selects see the snapshot from BEFORE
       the CTE's insert, so a first-time visitor was told there were zero
       visitors and only saw 1 on their next ping. */
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
        (select count(*) from (
           select sid from visitors where last_seen > now() - interval '2 minutes'
           union select ${sid}) a)::int as online,
        (select count(*) from (
           select sid from visitors where last_seen > now() - interval '7 days'
           union select ${sid}) b)::int as week,
        (select count(*) from (
           select sid from visitors union select ${sid}) c)::int as total,
        (coalesce((select n from counters where key = 'views'), 0)
           + case when ${view} then 1 else 0 end)::int as views
      from touch limit 1
    `);
    const rows = (r as unknown as { rows?: Record<string, number>[] }).rows ?? (r as unknown as Record<string, number>[]);
    return NextResponse.json(rows[0] ?? {});
  } catch (e) {
    console.error("[pulse] failed", e);
    return NextResponse.json({});
  }
}
