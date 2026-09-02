import { desc, eq } from "drizzle-orm";
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

  /* Pending is its own query. It used to take the newest 100 rows of ANY status
     and filter in JavaScript, so approved and rejected rows ate the same 100
     slots — past a hundred rows the oldest waiting submissions fell out of the
     result and could not be reached by any control on the page, while their
     plot page told the person it would appear "once it has been read". With no
     per-visitor submission cap any more, a single burst gets there in one go. */
  const pending = await db()
    .select()
    .from(schema.graves)
    .where(eq(schema.graves.status, "pending"))
    .orderBy(desc(schema.graves.created_at))
    .limit(200);

  const rest = await db()
    .select()
    .from(schema.graves)
    .where(eq(schema.graves.status, "approved"))
    .orderBy(desc(schema.graves.created_at))
    .limit(40);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-14">
      <a href="/" className="text-sm text-muted underline underline-offset-4 hover:text-accent">
        ← The wall
      </a>
      <h1 className="mt-4 text-2xl font-semibold">Queue</h1>
      <p className="mt-1 text-sm text-muted">
        {pending.length}
        {pending.length === 200 ? "+" : ""} waiting · newest first
      </p>

      <section className="mt-8 flex flex-col gap-6">
        {pending.length === 0 && <p className="text-body">Nothing waiting.</p>}
        {pending.map((r) => (
          <article key={r.id} className="rounded-xl border border-rule bg-surface p-5">
            <h2 className="font-medium text-ink">{r.feature}</h2>
            <p className="mt-1.5 leading-relaxed text-body">{r.summary}</p>

            {/* Everything that gets published, not a third of it. The queue used
                to show feature, summary, outcome, time and author only — so the
                free-text lesson that goes out under a real name, the hours that
                move a public total, the outbound link and the image were all
                approved sight unseen. "Nothing reaches the wall unread" has to
                mean the whole row. */}
            {r.lesson && (
              <p className="mt-3 border-l-2 border-accent/40 pl-3 text-sm leading-relaxed text-ink/80">
                <span className="text-[10px] tracking-[0.2em] text-accent uppercase">Lesson </span>
                {r.lesson}
              </p>
            )}
            {r.image_url && (
              <a href={r.image_url} target="_blank" rel="noopener nofollow" className="mt-3 block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.image_url} alt="" className="max-h-48 rounded-lg border border-rule" />
              </a>
            )}
            <p className="mt-3 text-xs text-muted">
              {r.outcome}
              {r.time_spent ? ` · ${r.time_spent}` : ""}
              {r.people && r.weeks ? ` · ${r.people} × ${r.weeks} ${r.effort ?? ""}` : ""}
              {r.hours ? ` · ${r.hours.toLocaleString()} h` : ""}
              {r.spend ? ` · $${r.spend.toLocaleString()}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted">
              {r.author ? `by ${r.author}` : "anonymous"}
              {r.author_url ? ` · ${r.author_url}` : ""}
              {` · /g/${r.slug}`}
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
