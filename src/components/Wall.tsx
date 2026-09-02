"use client";

import { useEffect, useMemo, useState } from "react";
import { visitorId } from "@/lib/pulseClient";
import { Entry } from "@/components/Entry";
import type { Grave } from "@/lib/entries";


/** Filtering happens here, not in the URL, so the page stays cacheable and a
 *  chip click costs nothing. */
const PAGE = 5;
const MORE = 10;

export function Wall({ rows, stones }: { rows: Grave[]; stones: Record<number, number> }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [q, setQ] = useState("");

  /* Every entry is already on the page — the wall is one cached query, capped
     at 200 — so this only governs how many are painted. Twenty-two full stories
     at once is a wall of text you scroll past; five is something you read.
     "See more" costs no request, which is why it can be this small a step. */
  const [take, setTake] = useState(PAGE);

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
  const matching = picked ? hits.filter((r) => r.outcome === picked) : hits;

  /* Changing the filter or the search means a different list, so the count
     starts again. Carrying 25 across from the previous list would drop the
     reader into the middle of a set they have not seen the start of. */
  const key = `${picked ?? ""}\u0000${q.trim().toLowerCase()}`;
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) { setLastKey(key); setTake(PAGE); }

  const shown = matching.slice(0, take);
  const left = matching.length - shown.length;

  /* One request for the whole visible page rather than one per card. Without
     this a wall of cards is a serverless invocation and a Neon query each, and
     Neon scales to zero — so a cold visitor would pay for all of them at once. */
  const [live, setLive] = useState<Record<number, { total: number; mine: boolean }>>({});
  const ids = shown.map((r) => r.id).join(",");
  useEffect(() => {
    if (!ids) return;
    let dead = false;
    fetch(`/api/stones?graves=${ids}&sid=${encodeURIComponent(visitorId())}`)
      .then((r) => r.json())
      .then((d) => {
        if (dead || !d?.totals) return;
        const mine: number[] = Array.isArray(d.mine) ? d.mine : [];
        const next: Record<number, { total: number; mine: boolean }> = {};
        for (const [k, v] of Object.entries(d.totals)) {
          next[Number(k)] = { total: Number(v) || 0, mine: mine.includes(Number(k)) };
        }
        setLive((prev) => ({ ...prev, ...next }));
      })
      .catch(() => {});
    return () => { dead = true; };
  }, [ids]);

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
        <button onClick={() => setPicked(null)} aria-pressed={!picked} className={chip(!picked)}>
          all
        </button>
        {[...counts.keys()]
          .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))
          .map((o) => (
          <button key={o} onClick={() => setPicked(o)} aria-pressed={picked === o} className={chip(picked === o)}>
            {o}
          </button>
        ))}
      </nav>

      {/* Not aria-live. It updated on every keystroke of the search box, so a
          screen reader read the whole count line out again per character. */}
      <p className="mt-8 text-xs text-muted">
        {matching.length} {matching.length === 1 ? "entry" : "entries"}
        {picked ? ` · ${picked}` : ""}
        {q.trim() ? ` · matching “${q.trim()}”` : ""}
        {left > 0 ? ` · showing ${shown.length}` : ""}
      </p>

      <section className="mt-6 flex flex-col gap-9">
        {shown.length === 0 ? (
          <p className="text-body">Nothing matches that. Try fewer words.</p>
        ) : (
          shown.map((e, i) => (
            <Entry key={e.id} e={e} i={i} stones={stones[e.id] ?? 0} hydrated={live[e.id]} />
          ))
        )}
      </section>

      {left > 0 && (
        <div className="mt-10 flex items-center gap-4">
          <button
            onClick={() => setTake((n) => n + MORE)}
            className="rounded-full border border-edge px-5 py-2.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
          >
            {left <= MORE ? `See the last ${left}` : `See ${MORE} more`}
          </button>
          <span className="text-xs text-faint">{left} still buried below</span>
        </div>
      )}
    </>
  );
}
