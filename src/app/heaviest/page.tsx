import type { Metadata } from "next";
import Link from "next/link";
import { heaviest, totals, unweighed } from "@/lib/entries";
import { bigHours, money, registry } from "@/lib/toll";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "The heaviest tolls — Feature Graveyard",
  description: "The features that cost the most hours, and were used the least.",
};

export default async function Heaviest() {
  const [rows, sum, rest] = await Promise.all([heaviest(25), totals(), unweighed()]);
  const all = bigHours(sum.hours);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-14 sm:px-6 sm:py-20">
      <Link href="/" className="text-sm text-muted underline underline-offset-4 hover:text-accent">
        ← The graveyard
      </Link>

      <header className="mt-8 flex flex-col gap-4">
        <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
          The heaviest tolls
        </h1>
        <p className="prose-tight max-w-prose text-lg leading-relaxed text-body">
          Ranked by hours, not money — so a solo founder&rsquo;s six months of evenings
          can outweigh a funded team&rsquo;s sprint. Which is the honest comparison.
        </p>
        <p className="prose-tight max-w-prose text-sm text-muted">
          People who register their own death say how hard they worked. For the
          entries gathered from public threads we use the intensity the author
          themselves described — &ldquo;four years trying to get my startup to
          revenue&rdquo; is counted as full time, &ldquo;a year of side-project
          evenings&rdquo; is not — and where they described none, nothing is
          counted at all, which is why most of the wall is not on this list.
          Every row links to what its author actually wrote.
        </p>
        <p className="prose-tight max-w-prose text-sm text-muted">
          Nobody has told us what any of this cost in money. A figure marked
          <span className="text-ink"> ≈ </span> is our estimate and not theirs:
          the hours above, priced at contract rates for the year the work
          happened. Where a story gave no duration to work from, there is no
          figure at all rather than a made-up one — which is most of them.
        </p>
      </header>

      {sum.graves > 0 && (
        <p className="mt-8 rounded-xl border border-rule bg-surface px-5 py-4">
          <span className="text-2xl font-semibold text-accent tabular-nums">{all.n}</span>{" "}
          <span className="text-body">full-time weeks</span>
          <span className="text-muted">
            {" "}
            buried across{" "}
            {sum.weighed === sum.graves
              ? `${sum.graves} features`
              : `${sum.weighed} of ${sum.graves} features weighed`}
          </span>
          {sum.spend > 0 && (
            <span className="text-muted">, and ${sum.spend.toLocaleString()} on top</span>
          )}
          <span className="text-muted">.</span>
        </p>
      )}

      {rows.length === 0 ? (
        <p className="mt-10 text-body">
          Nothing weighed yet.{" "}
          <Link href="/bury" className="text-accent underline underline-offset-4">
            Bury the first.
          </Link>
        </p>
      ) : (
        <ol className="mt-10 flex flex-col">
          {rows.map((r, i) => {
            const h = bigHours(r.hours ?? 0, r.people ?? 1);
            return (
              <li key={r.id}>
                <Link
                  href={`/g/${r.slug}`}
                  className="flex items-start gap-4 border-b border-rule py-4 transition-colors hover:border-accent"
                >
                  <span className="w-6 shrink-0 text-sm text-faint tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base text-ink sm:text-lg">{r.feature}</span>
                    {/* A line of the story. The right-hand figure is three
                        lines tall and the left was two, which left a hole
                        beside every row — and a ranked list of titles alone
                        tells you nothing about what any of them were. */}
                    {/* No `block` here. line-clamp sets display:-webkit-box, and `block`
                        overrode it — the clamp silently did nothing and every row
                        rendered its whole summary, 1900px tall. */}
                    <span className="mt-1 line-clamp-2 text-sm leading-snug text-body">
                      {r.summary}
                    </span>
                    <span className="mt-1.5 block text-xs text-muted">
                      {r.outcome}
                      {r.people && r.weeks ? ` · ${r.people} × ${r.weeks} weeks` : ""}
                      {r.author ?? r.source_author ? ` · ${r.author ?? r.source_author}` : ""}
                      {` · ${registry(r.id)}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-base font-semibold text-accent tabular-nums sm:text-lg">
                      {h.n}
                    </span>
                    {/* Plain units. "person-weeks" is precise and completely
                        opaque in a two-word column; the "2 × 78 weeks" on the
                        row above already says how many people. */}
                    <span className="block text-[10px] tracking-[0.1em] text-faint uppercase">
                      {(r.hours ?? 0) < 1000 ? "hours" : "weeks"}
                    </span>
                    {/* Always a value. A blank column reads as a rendering
                        fault, and "not said" is information. */}
                    {/* Always a value. A blank column reads as a rendering
                        fault, and both "not said" and a marked estimate are
                        information. */}
                    <span className="mt-0.5 block text-xs text-faint tabular-nums">
                      {money(r).text}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      {rest.length > 0 && (
        <section className="mt-14 border-t border-rule pt-10">
          <h2 className="text-lg font-semibold tracking-tight">Not weighed</h2>
          <p className="prose-tight mt-1.5 max-w-prose text-sm text-body">
            {rest.length} more, mostly gathered from public threads where the
            person never said how long it took. They are not ranked, because a
            figure invented to fill a table is worth nothing.
          </p>
          <ul className="mt-5 flex flex-col">
            {rest.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/g/${r.slug}`}
                  className="flex items-baseline gap-3 border-b border-rule py-3 transition-colors hover:border-accent"
                >
                  <span className="min-w-0 flex-1 truncate text-body">{r.feature}</span>
                  <span className="shrink-0 text-xs text-faint">{r.outcome}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-14 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-rule pt-8 text-xs text-muted">
        <Link href="/" className="underline underline-offset-4 hover:text-accent">The graveyard</Link>
        <span aria-hidden>·</span>
        <Link href="/lessons" className="underline underline-offset-4 hover:text-accent">What we have learned</Link>
        <span aria-hidden>·</span>
        <Link href="/bury" className="underline underline-offset-4 hover:text-accent">Bury one of yours</Link>
        <span aria-hidden>·</span>
        <a href="https://github.com/antionmil/swbc-feature-graveyard/issues/new?title=Please%20remove%20my%20entry" target="_blank" rel="noopener nofollow" className="underline underline-offset-4 hover:text-accent">Ask us to take something down</a>
      </footer>
    </main>
  );
}
