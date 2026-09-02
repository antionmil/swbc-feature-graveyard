import { desc, eq, ne } from "drizzle-orm";
import { db, hasDb, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Not auth — one env var in front of a takedown tool. Do not build accounts.
 *
 * There is no review queue: a burial is public the moment somebody makes it.
 * So this page is no longer about letting things through, it is about getting
 * something OFF the wall quickly, which means it has to show the whole row —
 * the lesson, the outbound link, the image, the hours — because those are the
 * parts that would be a problem, and none of them are visible anywhere else.
 */
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

  const live = await db()
    .select()
    .from(schema.graves)
    .where(eq(schema.graves.status, "approved"))
    .orderBy(desc(schema.graves.created_at))
    .limit(60);

  const down = await db()
    .select()
    .from(schema.graves)
    .where(ne(schema.graves.status, "approved"))
    .orderBy(desc(schema.graves.created_at))
    .limit(60);

  /* Seeded rows are the 22 imported entries. They are not what this page is
     for, and burying them among real submissions is how you miss a real one. */
  const own = live.filter((r) => !r.seeded);
  const seeded = live.filter((r) => r.seeded);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-14">
      <a href="/" className="text-sm text-muted underline underline-offset-4 hover:text-accent">
        ← The wall
      </a>
      <h1 className="mt-4 text-2xl font-semibold">Live now</h1>
      <p className="mt-1 text-sm text-muted">
        {own.length} registered here · {seeded.length} seeded · {down.length} taken down.
        Everything goes up on its own; this is where it comes back off.
      </p>

      <section className="mt-8 flex flex-col gap-6">
        {own.length === 0 && (
          <p className="text-body">Nobody has buried anything yet.</p>
        )}
        {own.map((r) => (
          <article key={r.id} className="rounded-xl border border-rule bg-surface p-5">
            <h2 className="font-medium text-ink">{r.feature}</h2>
            <p className="mt-1.5 leading-relaxed text-body">{r.summary}</p>
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
              {" · "}
              <a href={`/g/${r.slug}`} className="underline underline-offset-4 hover:text-accent">
                /g/{r.slug}
              </a>
            </p>
            <div className="mt-4">
              <Decide id={r.id} to="rejected" label="Take it down" k={k!} />
            </div>
          </article>
        ))}
      </section>

      {down.length > 0 && (
        <section className="mt-12 border-t border-rule pt-8">
          <h2 className="text-lg font-semibold tracking-tight">Taken down</h2>
          <p className="mt-1 text-sm text-muted">
            These 404 for everyone, link or no link.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            {down.map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-sm text-body">{r.feature}</span>
                <Decide id={r.id} to="approved" label="Put it back" k={k!} />
              </div>
            ))}
          </div>
        </section>
      )}

      {seeded.length > 0 && (
        <section className="mt-12 border-t border-rule pt-8">
          <h2 className="text-lg font-semibold tracking-tight">Seeded</h2>
          <p className="mt-1 text-sm text-muted">
            The {seeded.length} gathered from public threads. Someone asking to be
            removed lands here.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            {seeded.map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <a
                  href={`/g/${r.slug}`}
                  className="min-w-0 flex-1 truncate text-sm text-body underline underline-offset-4 hover:text-accent"
                >
                  {r.feature}
                </a>
                <span className="shrink-0 text-xs text-faint">{r.source_author}</span>
                <Decide id={r.id} to="rejected" label="Take it down" k={k!} />
              </div>
            ))}
          </div>
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
        className={`rounded-full px-4 py-1.5 text-sm font-medium ${
          primary ? "bg-accent text-ground" : "border border-edge text-muted hover:text-ink"
        }`}
      >
        {label}
      </button>
    </form>
  );
}
