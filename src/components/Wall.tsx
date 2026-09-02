"use client";

import { useState } from "react";
import { Entry } from "@/components/Entry";
import type { Grave } from "@/lib/entries";


/** Filtering happens here, not in the URL, so the page stays cacheable and a
 *  chip click costs nothing. */
export function Wall({ rows }: { rows: Grave[] }) {
  const [picked, setPicked] = useState<string | null>(null);

  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.outcome, (counts.get(r.outcome) ?? 0) + 1);
  const shown = picked ? rows.filter((r) => r.outcome === picked) : rows;

  if (rows.length === 0) {
    return (
      <p className="mt-10 text-body">
        Nothing buried yet.{" "}
        <a href="#submit" className="text-accent underline underline-offset-4">
          The first one starts the wall.
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
      <nav className="mt-9 flex flex-wrap items-start gap-x-6 gap-y-3" aria-label="Filter by outcome">
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
      </p>

      <section className="mt-6 flex flex-col gap-9">
        {shown.map((e, i) => <Entry key={e.id} e={e} i={i} />)}
      </section>
    </>
  );
}
