import { NextResponse } from "next/server";
import { hasDb } from "@/lib/db";

/** TEMPORARY. Reports the NAMES of database-shaped environment variables and
 *  nothing else — never a value, never a fragment of one. Delete once the
 *  connection is confirmed. */
export const dynamic = "force-dynamic";

export async function GET() {
  const names = Object.keys(process.env)
    .filter((k) => /^(DATABASE|POSTGRES|PG|NEON)/i.test(k))
    .sort();
  return NextResponse.json({
    hasDb: hasDb(),
    databaseShapedNames: names,
    adminPasswordSet: Boolean(process.env.ADMIN_PASSWORD),
    limitsRaw: {
      IP_DAILY_LIMIT: JSON.stringify(process.env.IP_DAILY_LIMIT ?? null),
      DAILY_GENERATION_CEILING: JSON.stringify(process.env.DAILY_GENERATION_CEILING ?? null),
    },
    build: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
  });
}
