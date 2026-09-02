import "server-only";
import { desc, eq } from "drizzle-orm";
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
