import { desc } from "drizzle-orm";
import { db, hasDb, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Not auth — a moderation queue behind one env var. Do not build accounts
 *  for this. It is reachable only by someone who knows the password, and the
 *  worst case is that a stranger reads submissions that are about to be
 *  public anyway. */
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ k?: string }>;
}) {
  const { k } = await searchParams;
  /* Trimmed on both sides. A value pasted into a hosting dashboard routinely
     carries a trailing space or newline, and the symptom is a password that
     is definitely correct and definitely rejected. */
  const pass = process.env.ADMIN_PASSWORD?.trim();

  if (!pass || k?.trim() !== pass) {
    return (
      <main className="mx-auto max-w-md px-5 py-24">
        <p className="text-body">
          Append <code className="text-ink">?k=</code> and the admin password.
        </p>
      </main>
    );
  }
  if (!hasDb()) {
    return (
      <main className="mx-auto max-w-md px-5 py-24">
        <p className="text-body">No database configured.</p>
      </main>
    );
  }

  const rows = await db()
    .select()
    .from(schema.graves)
    .orderBy(desc(schema.graves.created_at))
    .limit(100);

  const pending = rows.filter((r) => r.status === "pending");
  const rest = rows.filter((r) => r.status !== "pending");

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-14">
      <a href="/" className="text-sm text-muted underline underline-offset-4 hover:text-accent">
        ← The wall
      </a>
      <h1 className="mt-4 text-2xl font-semibold">Queue</h1>
      <p className="mt-1 text-sm text-muted">
        {pending.length} waiting · {rest.length} decided
      </p>

      <section className="mt-8 flex flex-col gap-6">
        {pending.length === 0 && <p className="text-body">Nothing waiting.</p>}
        {pending.map((r) => (
          <article key={r.id} className="rounded-xl border border-rule bg-surface p-5">
            <h2 className="font-medium text-ink">{r.feature}</h2>
            <p className="mt-1.5 leading-relaxed text-body">{r.summary}</p>
            <p className="mt-2 text-xs text-muted">
              {r.outcome}
              {r.time_spent ? ` · ${r.time_spent}` : ""}
              {r.author ? ` · ${r.author}` : ""}
            </p>
            <div className="mt-4 flex gap-3">
              <Decide id={r.id} to="approved" label="Publish" k={k!} primary />
              <Decide id={r.id} to="rejected" label="Reject" k={k!} />
            </div>
          </article>
        ))}
      </section>

      {rest.length > 0 && (
        <section className="mt-12 flex flex-col gap-2 border-t border-rule pt-8">
          {rest.map((r) => (
            <p key={r.id} className="flex gap-3 text-sm">
              <span className={r.status === "approved" ? "text-accent" : "text-faint"}>
                {r.status === "approved" ? "live" : "no"}
              </span>
              <span className="truncate text-body">{r.feature}</span>
            </p>
          ))}
        </section>
      )}
    </main>
  );
}

function Decide({
  id, to, label, k, primary,
}: { id: number; to: string; label: string; k: string; primary?: boolean }) {
  return (
    <form action="/api/moderate" method="post">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="to" value={to} />
      <input type="hidden" name="k" value={k} />
      <button
        className={`rounded-full px-5 py-2 text-sm font-medium ${
          primary ? "bg-accent text-ground" : "border border-rule text-muted hover:text-ink"
        }`}
      >
        {label}
      </button>
    </form>
  );
}
