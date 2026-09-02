import { isNull, or, eq } from "drizzle-orm";
import { db, schema } from "../src/lib/db";
import { newSlug } from "../src/lib/slug";
try { process.loadEnvFile(".env.local"); } catch {}

/** The 13 seeds predate slugs. Give each one a plot. */
async function main() {
  const rows = await db().select().from(schema.graves)
    .where(or(isNull(schema.graves.slug), eq(schema.graves.slug, "")));
  for (const r of rows) {
    await db().update(schema.graves).set({ slug: newSlug() }).where(eq(schema.graves.id, r.id));
  }
  console.log(`  gave ${rows.length} existing entries a plot`);
}
main();
