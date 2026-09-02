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

  /* The count gets its own weight and spacing. Set flush against the label it
     read as one run-on string — "shipped, unused 5" looked like a typo. */
  const chip = (active: boolean) =>
    `inline-flex items-baseline gap-2 rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
      active ? "border-accent text-accent" : "border-rule text-muted hover:border-faint hover:text-body"
    }`;
  const num = (active: boolean) =>
    `tabular-nums text-[11px] ${active ? "text-accent/70" : "text-faint"}`;

  return (
    <>
      <nav className="mt-9 flex flex-wrap gap-2" aria-label="Filter by outcome">
        <button onClick={() => setPicked(null)} className={chip(!picked)}>
          <span>all</span>
          <span className={num(!picked)}>{rows.length}</span>
        </button>
        {[...counts.keys()]
          .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))
          .map((o) => (
          <button key={o} onClick={() => setPicked(o)} className={chip(picked === o)}>
            <span>{o}</span>
            <span className={num(picked === o)}>{counts.get(o)}</span>
          </button>
        ))}
      </nav>

      <section className="mt-10 flex flex-col gap-9">
        {shown.map((e, i) => <Entry key={e.id} e={e} i={i} />)}
      </section>
    </>
  );
}
