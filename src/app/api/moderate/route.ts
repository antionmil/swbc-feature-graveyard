import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { db, hasDb, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

/** The password travels in the form body, not the query string, so it does not
 *  end up in a referrer header or a server access log. */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const k = String(form.get("k") ?? "");
  const pass = process.env.ADMIN_PASSWORD;

  if (!pass || k !== pass) return new NextResponse("no", { status: 403 });
  if (!hasDb()) return new NextResponse("no database", { status: 503 });

  const id = Number(form.get("id"));
  const to = String(form.get("to"));
  if (!Number.isInteger(id) || !["approved", "rejected"].includes(to)) {
    return new NextResponse("bad request", { status: 400 });
  }

  await db().update(schema.graves).set({ status: to }).where(eq(schema.graves.id, id));
  /* Without this an approval waits out the 60-second window before it shows,
     and the first thing you do after publishing is go and look at it.
     revalidatePath, not revalidateTag — Next 16 changed revalidateTag to
     require a cache-life profile, and guessing at profile names to save one
     call is not worth a runtime surprise. */
  revalidatePath("/");
  return NextResponse.redirect(new URL(`/admin?k=${encodeURIComponent(k)}`, req.nextUrl.origin), 303);
}
