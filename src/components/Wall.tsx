"use client";

import { useMemo, useState } from "react";
import { Entry } from "@/components/Entry";
import type { Grave } from "@/lib/entries";


/** Filtering happens here, not in the URL, so the page stays cacheable and a
 *  chip click costs nothing. */
export function Wall({ rows }: { rows: Grave[] }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [q, setQ] = useState("");

  /* Searched in the browser over rows already on the page. The wall is capped
     at 200, so a server round trip per keystroke would buy nothing and cost a
     cold Neon connection each time. */
  const hits = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      `${r.feature} ${r.summary} ${r.outcome} ${r.author ?? ""}`.toLowerCase().includes(needle),
    );
  }, [rows, q]);

  const counts = new Map<string, number>();
  for (const r of hits) counts.set(r.outcome, (counts.get(r.outcome) ?? 0) + 1);
  const shown = picked ? hits.filter((r) => r.outcome === picked) : hits;

  if (rows.length === 0) {
    return (
      <p className="mt-8 text-body">
        Nothing buried yet.{" "}
        <a href="/bury" className="text-accent underline underline-offset-4">
          Yours would be the first.
        </a>
      </p>
    );
  }

  /* Bordered pills made six wide boxes of different lengths, and the count
     inside each one fought the label for the same line. This is a row of
     words with the count set small and raised — the active one is marked by
     an underline rather than a whole extra shape. */
  /* No count inside the tag. A number wedged next to a label made every tag a
     different width and read as part of the word. The count belongs above the
     results, where it describes what you are actually looking at. */
  const chip = (active: boolean) =>
    `border-b-2 pb-1 text-sm transition-colors ${
      active ? "border-accent text-ink" : "border-transparent text-muted hover:text-body"
    }`;

  return (
    <>
      <div className="mt-9">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search the graveyard"
          aria-label="Search the graveyard"
          className="w-full rounded-lg border border-edge bg-surface px-4 py-3 text-ink outline-none placeholder:text-faint focus:border-accent"
        />
      </div>

      <nav className="mt-6 flex flex-wrap items-start gap-x-6 gap-y-3" aria-label="Filter by outcome">
        <button onClick={() => setPicked(null)} className={chip(!picked)}>
          all
        </button>
        {[...counts.keys()]
          .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))
          .map((o) => (
          <button key={o} onClick={() => setPicked(o)} className={chip(picked === o)}>
            {o}
          </button>
        ))}
      </nav>

      <p className="mt-8 text-xs text-muted" aria-live="polite">
        {shown.length} {shown.length === 1 ? "entry" : "entries"}
        {picked ? ` · ${picked}` : ""}
        {q.trim() ? ` · matching “${q.trim()}”` : ""}
      </p>

      <section className="mt-6 flex flex-col gap-9">
        {shown.length === 0 ? (
          <p className="text-body">Nothing matches that. Try fewer words.</p>
        ) : (
          shown.map((e, i) => <Entry key={e.id} e={e} i={i} />)
        )}
      </section>
    </>
  );
}
