"use client";

import { useState } from "react";
import { OTHER, OUTCOMES } from "@/lib/outcomes";

export function SubmitForm() {
  const [startedAt] = useState(() => Date.now());
  const [outcome, setOutcome] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          feature: f.get("feature"),
          summary: f.get("summary"),
          outcome: f.get("outcome"),
          outcome_other: f.get("outcome_other"),
          time_spent: f.get("time_spent"),
          author: f.get("author"),
          trap: f.get("website"), // honeypot
          startedAt,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "That did not save.");
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "That did not save.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-rule bg-surface p-6 text-center">
        <p className="font-medium text-ink">Buried.</p>
        <p className="prose-tight mt-1.5 text-sm text-body">
          It goes up once I have read it. Everything here is read first — that is
          what keeps the wall worth reading.
        </p>
        {/* A confirmation with no way onward is a dead end. */}
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
          <a href="#top" className="text-accent underline underline-offset-4">Back to the wall</a>
          <button
            onClick={() => setDone(false)}
            className="text-muted underline underline-offset-4 hover:text-ink"
          >
            Add another
          </button>
        </div>
      </div>
    );
  }

  const field =
    "w-full rounded-lg border border-rule bg-surface px-4 py-3 text-ink outline-none placeholder:text-faint focus:border-accent";

  return (
    <form onSubmit={send} className="flex flex-col gap-4">
      {/* Honeypot. Hidden from people, irresistible to bots. Not display:none —
          some bots skip those. */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <label className="flex flex-col gap-1.5">
        <span className="text-xs tracking-[0.1em] text-muted uppercase">What you built</span>
        <input name="feature" required maxLength={120} className={field}
               placeholder="A recommendation engine" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs tracking-[0.1em] text-muted uppercase">What happened to it</span>
        <textarea name="summary" required minLength={20} maxLength={600} rows={4}
                  className={`${field} resize-y`}
                  placeholder="Shipped it behind a flag. Turned the flag on for 5% of users. Nobody clicked it once in three months, so we took it out." />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs tracking-[0.1em] text-muted uppercase">Outcome</span>
          <select
            name="outcome"
            required
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className={field}
          >
            <option value="" disabled>Pick one</option>
            {OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
            <option value={OTHER}>something else…</option>
          </select>
          {/* Only asked for once it is needed. A second empty box sitting there
              permanently makes the form look longer than it is. */}
          {outcome === OTHER && (
            <input
              name="outcome_other"
              required
              maxLength={32}
              autoFocus
              className={`${field} mt-1.5`}
              placeholder="in a couple of words"
            />
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs tracking-[0.1em] text-muted uppercase">
            How long · optional
          </span>
          <input name="time_spent" maxLength={40} className={field} placeholder="about three weeks" />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs tracking-[0.1em] text-muted uppercase">Your name · optional</span>
        <input name="author" maxLength={60} className={field} placeholder="leave blank to stay anonymous" />
      </label>

      {err && <p className="text-sm text-accent">{err}</p>}

      <button
        disabled={busy}
        className="self-start rounded-full bg-accent px-7 py-3 text-sm font-medium tracking-[0.06em] text-ground disabled:opacity-40"
      >
        {busy ? "Burying…" : "Bury it"}
      </button>

      <p className="prose-tight text-xs text-muted">
        Read before it goes up. No account, no email, nothing stored about you
        beyond what you typed.
      </p>
    </form>
  );
}
