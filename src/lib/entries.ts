import "server-only";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, hasDb, schema } from "@/lib/db";

export type Grave = typeof schema.graves.$inferSelect;

export { OUTCOMES, isOutcome, type Outcome } from "./outcomes";

async function readWall(): Promise<Grave[]> {
  if (!hasDb()) return [];
  try {
    return await db().select().from(schema.graves)
      .where(eq(schema.graves.status, "approved"))
      .orderBy(desc(schema.graves.created_at)).limit(200);
  } catch (e) {
    // A wall that cannot read must render empty, never 500.
    console.error("[wall] read failed", e);
    return [];
  }
}

/**
 * Every approved entry, cached.
 *
 * Not filtered here, and not read per request. Filtering server-side meant
 * reading `searchParams`, which makes the page dynamic — a Neon query on every
 * view, and Neon scales to zero after five minutes idle, so the first visitor
 * after a quiet spell waits for a cold start. The wall is capped at 200 rows,
 * so the whole thing is fetched once and the filter runs in the browser: the
 * page caches, and a chip click is instant instead of a navigation.
 */
export const wall = unstable_cache(readWall, ["wall"], { revalidate: 60, tags: ["wall"] });

/** Counts per outcome, for the filter row. Derived from the rows already
 *  fetched rather than a second query — the wall is capped at 200. */
export function tally(rows: Grave[]) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.outcome, (m.get(r.outcome) ?? 0) + 1);
  return m;
}

/** One grave, by its plot. Returns pending ones too — the person who buried it
 *  gets the link immediately, and the page tells them it is awaiting review. */
export async function grave(slug: string) {
  if (!hasDb()) return null;
  try {
    const [row] = await db().select().from(schema.graves)
      .where(eq(schema.graves.slug, slug)).limit(1);
    return row ?? null;
  } catch (e) {
    console.error("[grave] read failed", e);
    return null;
  }
}

export async function stoneCount(graveId: number, sid?: string) {
  if (!hasDb()) return { total: 0, mine: false };
  try {
    const [row] = await db()
      .select({
        total: sql<number>`count(*)::int`,
        mine: sql<number>`count(*) filter (where sid = ${sid ?? ""})::int`,
      })
      .from(schema.stones)
      .where(eq(schema.stones.grave_id, graveId));
    return { total: row?.total ?? 0, mine: (row?.mine ?? 0) > 0 };
  } catch (e) {
    console.error("[stones] read failed", e);
    return { total: 0, mine: false };
  }
}

/** Stone counts for a whole page of graves, in one query rather than one per
 *  row — a wall of 200 would otherwise be 200 round trips. */
export async function stonesFor(ids: number[]) {
  const out = new Map<number, number>();
  if (!hasDb() || ids.length === 0) return out;
  try {
    const rows = await db()
      .select({ id: schema.stones.grave_id, n: sql<number>`count(*)::int` })
      .from(schema.stones)
      .groupBy(schema.stones.grave_id);
    for (const r of rows) out.set(r.id, r.n);
  } catch (e) {
    console.error("[stones] tally failed", e);
  }
  return out;
}

/** Every stated duration, added up. The one number that travels: how much
 *  engineering time is buried here. Durations are free text, so this parses
 *  what it can and says how many it could not. */
export function timeBuried(rows: Grave[]) {
  const UNIT: Record<string, number> = {
    day: 1, days: 1, week: 7, weeks: 7, month: 30, months: 30,
    year: 365, years: 365, yr: 365, yrs: 365, sprint: 14, sprints: 14,
  };
  let days = 0, counted = 0;
  for (const r of rows) {
    const m = r.time_spent?.toLowerCase().match(/(\d+(?:\.\d+)?)\s*([a-z]+)/);
    if (!m || !UNIT[m[2]]) continue;
    days += Number(m[1]) * UNIT[m[2]];
    counted++;
  }
  return { days, counted, unknown: rows.length - counted };
}

/** The heaviest tolls. Ranked on `hours`, which is stored rather than computed
 *  so this is one indexed read. Only approved entries — the ranking is a
 *  public statement about people, so nothing unreviewed goes in it. */
export const heaviest = unstable_cache(
  async (limit = 25): Promise<Grave[]> => {
    if (!hasDb()) return [];
    try {
      return await db().select().from(schema.graves)
        .where(and(eq(schema.graves.status, "approved"), isNotNull(schema.graves.hours)))
        .orderBy(desc(schema.graves.hours)).limit(limit);
    } catch (e) {
      console.error("[heaviest] read failed", e);
      return [];
    }
  },
  ["heaviest"],
  { revalidate: 60 },
);

/** Everything the graveyard has swallowed. The number that travels. */
export const totals = unstable_cache(
  async () => {
    if (!hasDb()) return { graves: 0, hours: 0, spend: 0, weighed: 0 };
    try {
      const [r] = await db()
        .select({
          graves: sql<number>`count(*)::int`,
          hours: sql<number>`coalesce(sum(hours),0)::int`,
          spend: sql<number>`coalesce(sum(spend),0)::int`,
          // How many actually carry an hour count. The total comes from these
          // and saying so is the difference between a real figure and a claim.
          weighed: sql<number>`count(*) filter (where hours is not null)::int`,
        })
        .from(schema.graves)
        .where(eq(schema.graves.status, "approved"));
      return r ?? { graves: 0, hours: 0, spend: 0, weighed: 0 };
    } catch (e) {
      console.error("[totals] read failed", e);
      return { graves: 0, hours: 0, spend: 0, weighed: 0 };
    }
  },
  ["totals"],
  { revalidate: 60 },
);

/** Where this burial sits against the rest. "Heavier than 73%" is the line
 *  someone screenshots; a raw rank is not. */
export async function heavierThan(hours: number) {
  if (!hasDb() || !hours) return null;
  try {
    const [r] = await db()
      .select({
        below: sql<number>`count(*) filter (where hours < ${hours})::int`,
        all: sql<number>`count(*)::int`,
      })
      .from(schema.graves)
      .where(and(eq(schema.graves.status, "approved"), isNotNull(schema.graves.hours)));
    if (!r || r.all < 5) return null; // a percentage of four things is theatre
    return Math.round((r.below / r.all) * 100);
  } catch {
    return null;
  }
}