import { sql } from "drizzle-orm";
import { db } from "../src/lib/db";

/* Loaded here because these scripts run outside Next, which is what loads
   .env.local for the app. `db.ts` reads the variable lazily inside db(), so
   doing this at the top of the module is early enough. */
try {
  process.loadEnvFile(".env.local");
} catch {
  // Already in the environment (CI), or no local file. Both fine.
}


async function main() {
  const t = await db().execute(
    sql`select table_name from information_schema.tables where table_schema='public' order by 1`,
  );
  const rows = (t as unknown as { rows?: Record<string, unknown>[] }).rows ?? (t as unknown as Record<string, unknown>[]);
  console.log("  tables:", rows.map((r) => r.table_name).join(", "));
}
main().catch((e) => { console.error("  FAILED:", e.message); process.exitCode = 1; });
