import { Stones } from "@/components/Stones";
import { authorLink } from "@/lib/outcomes";
import type { Grave } from "@/lib/entries";

/* An absolute date, not "3 days ago". The wall is a statically cached page, so
   a relative date is computed at build time and then quietly lies for as long
   as the cache lives. */
const fmt = (d: Date | string | null | undefined) => {
  if (!d) return null;
  const t = new Date(d);
  return Number.isNaN(t.getTime())
    ? null
    : t.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

/**
 * The date that means something for this entry.
 *
 * For a burial somebody registers here, that is when they registered it. For
 * one gathered from a public thread it is when they WROTE it — using the row's
 * insert time put "buried 2 Sept 2026" on all 22 seeded entries, which is the
 * afternoon they were imported and a day on which nothing happened to any of
 * them. The verb changes with the source, because "buried" is not true of a
 * comment somebody left on Hacker News in 2009.
 */
function dateline(e: { seeded: boolean; source_date: string | null; created_at: Date | string }) {
  if (e.seeded && e.source_date) {
    const when = fmt(e.source_date);
    return when ? { verb: "told", when } : null;
  }
  const when = fmt(e.created_at);
  return when ? { verb: "buried", when } : null;
}

/**
 * One confession.
 *
 * The story is the hero and the metadata is a footnote — that ordering is the
 * whole design. Leading with the duration would make this a cost counter, and
 * eleven of the thirteen seeded entries have no duration at all.
 */
export function Entry({
  e,
  i = 0,
  stones = 0,
  hydrated,
}: {
  e: Grave;
  i?: number;
  stones?: number;
  hydrated?: { total: number; mine: boolean };
}) {
  const when = dateline(e);
  return (
    <article
      className="rise border-l-2 border-rule pl-4 sm:pl-5"
      style={{ animationDelay: `${Math.min(i, 12) * 0.04}s` }}
    >
      <h3 className="text-base leading-snug font-medium sm:text-lg">
        <a href={`/g/${e.slug}`} className="text-ink hover:text-accent">
          {e.feature}
        </a>
      </h3>

      <p className="prose-tight mt-1.5 leading-relaxed text-body">{e.summary}</p>

      {e.lesson && (
        <p className="prose-tight mt-2.5 border-l-2 border-accent/40 pl-3 text-sm leading-relaxed text-ink/75">
          <span className="text-[10px] tracking-[0.2em] text-accent uppercase">Take from it </span>
          {e.lesson}
        </p>
      )}

      {/* A screenshot of the thing beats a paragraph about it. Capped in
          height so one tall phone screenshot cannot own the whole feed. */}
      {e.image_url && (
        <a href={`/g/${e.slug}`} className="mt-3 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={e.image_url}
            alt={`A screenshot of ${e.feature}`}
            loading="lazy"
            className="max-h-64 w-full rounded-lg border border-rule object-cover object-top"
          />
        </a>
      )}

      <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <span className="text-faint">{e.outcome}</span>
        {/* The date the wall is ordered by, so the order is legible. */}
        {when && (
          <>
            <span aria-hidden>·</span>
            <span className="text-faint">
              {when.verb} {when.when}
            </span>
          </>
        )}
        {/* Only rendered when it exists. A dash or a "—" in this slot invites
            somebody to fill it in with a guess. */}
        {e.time_spent && (
          <>
            <span aria-hidden>·</span>
            <span>{e.time_spent}</span>
          </>
        )}
        {e.author && (
          <>
            <span aria-hidden>·</span>
            {authorLink(e.author_url) ? (
              <a
                href={authorLink(e.author_url)!.url}
                target="_blank" rel="noopener nofollow"
                className="text-body underline underline-offset-4 hover:text-accent"
              >
                {e.author}
              </a>
            ) : (
              <span className="text-body">{e.author}</span>
            )}
          </>
        )}
        {e.seeded && e.source_url && (
          <>
            <span aria-hidden>·</span>
            <a
              href={e.source_url}
              target="_blank" rel="noopener nofollow"
              className="underline underline-offset-4 hover:text-accent"
            >
              {e.source_author ? `${e.source_author} on ` : ""}
              {e.source_site ?? "the source"}
              {" ↗"}
            </a>
          </>
        )}
      </p>

      {/* The stone lives here too, not only on the plot. Leaving one is the
          cheapest thing anybody will ever do on this site, and making them
          open the entry first cost most of them. */}
      <div className="mt-3">
        <Stones graveId={e.id} initial={stones} hydrated={hydrated} managed compact />
      </div>
    </article>
  );
}
