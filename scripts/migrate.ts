import { sql } from "drizzle-orm";
import { db } from "../src/lib/db";
import { newSlug } from "../src/lib/slug";
try { process.loadEnvFile(".env.local"); } catch {}

/** Explicit and additive. `drizzle-kit push` offered to TRUNCATE the table to
 *  add the unique constraint, which would have deleted every seeded entry. */
async function main() {
  const d = db();
  await d.execute(sql`alter table graves add column if not exists image_url text`);
  await d.execute(sql`alter table graves add column if not exists slug text`);

  const rows = await d.execute(sql`select id from graves where slug is null or slug = ''`);
  const list = (rows as unknown as { rows?: { id: number }[] }).rows ?? (rows as unknown as { id: number }[]);
  for (const r of list) {
    await d.execute(sql`update graves set slug = ${newSlug()} where id = ${r.id}`);
  }
  console.log(`  backfilled ${list.length} slugs`);

  await d.execute(sql`alter table graves alter column slug set not null`);
  await d.execute(sql`create unique index if not exists graves_slug_unique on graves (slug)`);

  await d.execute(sql`
    create table if not exists stones (
      grave_id integer not null,
      sid text not null,
      created_at timestamptz not null default now(),
      primary key (grave_id, sid)
    )`);
  await d.execute(sql`create index if not exists stones_grave_idx on stones (grave_id)`);

  const check = await d.execute(sql`
    select (select count(*) from graves)::int as graves,
           (select count(*) from graves where slug is not null)::int as with_slug,
           (select count(*) from stones)::int as stones`);
  const c = ((check as unknown as { rows?: Record<string, number>[] }).rows ?? (check as unknown as Record<string, number>[]))[0];
  console.log("  ", c);
}
main();
