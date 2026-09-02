/**
 * Loads the curated seeds onto the wall.
 *
 * Run after a human has opened each source link and checked the summary is
 * fair. `verified` is not decoration — an entry that has not been read against
 * its own thread does not go up, and this script refuses to insert until every
 * one of them has been.
 *
 *   pnpm seed          dry run, prints what it would insert
 *   pnpm seed --write  inserts
 *
 * `pnpm` always runs a script with the package root as the working directory,
 * which is what makes the path below reliable.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { db, hasDb, schema } from "../src/lib/db";
import { isOutcome } from "../src/lib/outcomes";

/* Loaded here because these scripts run outside Next, which is what loads
   .env.local for the app. `db.ts` reads the variable lazily inside db(), so
   doing this at the top of the module is early enough. */
try {
  process.loadEnvFile(".env.local");
} catch {
  // Already in the environment (CI), or no local file. Both fine.
}


type Seed = {
  feature: string;
  summary: string;
  outcome: string;
  time_spent: string | null;
  users: string | null;
  verified: boolean;
  source: { site: string; author: string; date: string; url: string };
};

async function main() {
  const write = process.argv.includes("--write");
  const path = resolve(process.cwd(), "../prep/seeds.json");
  const file = JSON.parse(readFileSync(path, "utf8"));
  const seeds: Seed[] = file.seeds ?? file;

  const unverified = seeds.filter((s) => !s.verified);
  if (unverified.length) {
    console.error(`\n  ${unverified.length} of ${seeds.length} seeds are not verified.`);
    console.error("  Open each url, check the summary is fair to the author, set verified: true.\n");
    for (const s of unverified) console.error(`    · ${s.feature}\n      ${s.source.url}`);
    console.error("\n  Nothing inserted.\n");
    process.exitCode = 1;
    return;
  }

  /* The seeds were labelled by hand before the fixed list existed, so they
     carry near-duplicates. Mapped explicitly and reported, never silently —
     "unused" and "shipped, unused" are the same thing, and letting both onto
     the wall is precisely what the fixed list is for. */
  const MAP: Record<string, string> = { unused: "shipped, unused" };
  for (const s of seeds) {
    const to = MAP[s.outcome];
    if (to) {
      console.log(`  mapped  ${s.outcome} -> ${to}   (${s.feature})`);
      s.outcome = to;
    }
  }

  const bad = seeds.filter((s) => !isOutcome(s.outcome));
  if (bad.length) {
    console.error("\n  Outcomes outside the fixed list, decide before seeding:");
    for (const s of bad) console.error(`    · "${s.outcome}"  —  ${s.feature}\n      ${s.source.url}`);
    console.error("\n  Either relabel them in prep/seeds.json or drop the entry.\n");
    process.exitCode = 1;
    return;
  }

  if (!write) {
    console.log(`\n  ${seeds.length} seeds ready. Re-run with --write to insert.\n`);
    for (const s of seeds) console.log(`    · ${s.feature}  [${s.outcome}]`);
    console.log();
    return;
  }

  if (!hasDb()) {
    console.error("  DATABASE_URL is not set.");
    process.exitCode = 1;
    return;
  }

  await db().insert(schema.graves).values(
    seeds.map((s) => ({
      feature: s.feature,
      summary: s.summary,
      outcome: s.outcome,
      time_spent: s.time_spent,
      seeded: true,
      source_url: s.source.url,
      source_site: s.source.site,
      source_author: s.source.author,
      source_date: s.source.date,
      status: "approved" as const,
    })),
  );
  console.log(`\n  Inserted ${seeds.length}.\n`);
}

main();
