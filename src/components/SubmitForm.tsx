"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { MAX_OUTCOME, OTHER, OUTCOMES } from "@/lib/outcomes";
import { Ceremony } from "@/components/Ceremony";
import { EFFORTS, hoursOf } from "@/lib/toll";

export function SubmitForm() {
  const [startedAt] = useState(() => Date.now());
  const [outcome, setOutcome] = useState("");
  const [custom, setCustom] = useState(0);
  const [people, setPeople] = useState(1);
  const [weeks, setWeeks] = useState(6);
  const [effort, setEffort] = useState<string>("evenings");
  const live = hoursOf(people, weeks, effort);
  const [feature, setFeature] = useState("");
  const [outcomeLabel, setOutcomeLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [buried, setBuried] = useState<{ id: number; hours: number; spend: number | null } | null>(null);
  const [shot, setShot] = useState<{ name: string; url: string } | null>(null);
  const [shooting, setShooting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickShot(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setErr("That image is over 5 MB. A screenshot should be well under it.");
      e.target.value = "";
      return;
    }
    setShooting(true);
    setErr(null);
    try {
      /* Straight to storage, not through our API — a serverless body is capped
         near 4.5 MB and a phone screenshot clears that easily. */
      const b = await upload(f.name, f, { access: "public", handleUploadUrl: "/api/upload" });
      setShot({ name: f.name, url: b.url });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "That image did not upload.");
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setShooting(false);
    }
  }

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
          people, weeks, effort,
          spend: f.get("spend"),
          author: f.get("author"),
          author_url: f.get("author_url"),
          image_url: shot?.url ?? null,
          trap: f.get("website"), // honeypot
          startedAt,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "That did not save.");
      setSlug(typeof d.slug === "string" ? d.slug : "");
      setOutcomeLabel(String(f.get("outcome") === OTHER ? f.get("outcome_other") : f.get("outcome")) || "");
      setBuried({ id: d.id ?? 0, hours: d.hours ?? live, spend: Number(f.get("spend")) || null });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "That did not save.");
    } finally {
      setBusy(false);
    }
  }

  if (slug !== null) {
    const url = `https://featuregraveyard.onedaybuilt.com/g/${slug}`;
    return (
      <div className="flex flex-col gap-5">
        {buried && (
          <Ceremony
            feature={feature}
            outcome={outcomeLabel}
            hours={buried.hours}
            spend={buried.spend}
            id={buried.id}
            slug={slug}
          />
        )}
      <div className="rounded-xl border border-rule bg-surface p-6">
        <p className="font-medium text-ink">Buried. The plot is yours.</p>
        <p className="prose-tight mt-1.5 text-sm text-body">
          This link works now. Paste it wherever the decision needs to land —
          it unfurls with the whole story, which is the point. It joins the wall
          once it has been read.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg border border-rule bg-ground px-3 py-2 text-xs text-body">
            {url}
          </code>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-ground"
          >
            {copied ? "copied" : "copy"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <a href={`/g/${slug}`} className="text-accent underline underline-offset-4">See the plot</a>
          <a href="#top" className="text-muted underline underline-offset-4 hover:text-ink">Back to the wall</a>
          <button onClick={() => { setSlug(null); setBuried(null); }} className="text-muted underline underline-offset-4 hover:text-ink">
            Bury another
          </button>
        </div>
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
               value={feature} onChange={(e) => setFeature(e.target.value)}
               placeholder="A recommendation engine" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs tracking-[0.1em] text-muted uppercase">What happened to it</span>
        <textarea name="summary" required minLength={20} maxLength={600} rows={4}
                  className={`${field} resize-y`}
                  placeholder="Shipped it behind a flag. Turned the flag on for 5% of users. Nobody clicked it once in three months, so we took it out." />
      </label>

      {/* The toll. Three questions anybody can answer from memory, and the
          number moves as they answer — which is what makes them honest about
          the third one. */}
      <fieldset className="flex flex-col gap-4 rounded-lg border border-rule bg-surface p-4">
        <legend className="px-1 text-xs tracking-[0.1em] text-muted uppercase">What it cost</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">How many people</span>
            <input
              type="number" min={1} max={200} value={people}
              onChange={(e) => setPeople(Math.max(1, Number(e.target.value) || 1))}
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">For how many weeks</span>
            <input
              type="number" min={1} max={520} value={weeks}
              onChange={(e) => setWeeks(Math.max(1, Number(e.target.value) || 1))}
              className={field}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">How hard</span>
          <select value={effort} onChange={(e) => setEffort(e.target.value)} className={field}>
            {EFFORTS.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label} — {x.blurb} ({x.hoursPerWeek}h a week)
              </option>
            ))}
          </select>
        </label>

        <p className="text-sm text-body">
          <span className="font-medium text-accent tabular-nums">{live.toLocaleString()}</span> hours
          of your life. <span className="text-faint">That is what goes on the stone.</span>
        </p>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Money on top · optional</span>
          <input
            name="spend" type="number" min={0} className={field}
            placeholder="ads, contractors, tools — leave blank if none"
          />
        </label>
      </fieldset>

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
            <>
              <input
                name="outcome_other"
                required
                maxLength={MAX_OUTCOME}
                autoFocus
                onChange={(e) => setCustom(e.target.value.length)}
                className={`${field} mt-1.5`}
                placeholder="in a couple of words"
              />
              <span className="text-xs text-faint">
                {MAX_OUTCOME - custom} characters left — it becomes a filter tag
              </span>
            </>
          )}
        </label>

      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs tracking-[0.1em] text-muted uppercase">
          A screenshot · optional
        </span>
        {shot ? (
          <div className="flex items-center gap-3 rounded-lg border border-rule bg-surface px-4 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot.url} alt="" className="h-12 w-12 rounded object-cover" />
            <span className="min-w-0 flex-1 truncate text-sm text-body">{shot.name}</span>
            <button
              type="button"
              onClick={() => {
                setShot(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="text-sm text-muted underline underline-offset-4 hover:text-ink"
            >
              remove
            </button>
          </div>
        ) : (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={pickShot}
              disabled={shooting}
              className="w-full rounded-lg border border-rule bg-surface px-4 py-3 text-sm text-body file:mr-3 file:rounded-full file:border-0 file:bg-rule file:px-3 file:py-1.5 file:text-xs file:text-body"
            />
            <span className="text-xs text-faint">
              {shooting ? "uploading…" : "PNG, JPEG, WebP or GIF, up to 5 MB. Seeing the thing beats reading about it."}
            </span>
          </>
        )}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs tracking-[0.1em] text-muted uppercase">Your name · optional</span>
        <input name="author" maxLength={60} className={field} placeholder="leave blank to stay anonymous" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs tracking-[0.1em] text-muted uppercase">
          Where to find you · optional
        </span>
        <input
          name="author_url"
          maxLength={120}
          className={field}
          placeholder="github.com/you, or x.com/you"
        />
      </label>

      {err && <p className="text-sm text-accent">{err}</p>}

      <button
        disabled={busy || shooting}
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
