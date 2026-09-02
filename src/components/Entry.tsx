import type { Grave } from "@/lib/entries";

/**
 * One confession.
 *
 * The story is the hero and the metadata is a footnote — that ordering is the
 * whole design. Leading with the duration would make this a cost counter, and
 * eleven of the thirteen seeded entries have no duration at all.
 */
export function Entry({ e, i = 0 }: { e: Grave; i?: number }) {
  return (
    <article
      className="rise border-l-2 border-rule pl-4 sm:pl-5"
      style={{ animationDelay: `${Math.min(i, 12) * 0.04}s` }}
    >
      <h3 className="text-base leading-snug font-medium text-ink sm:text-lg">{e.feature}</h3>

      <p className="prose-tight mt-1.5 leading-relaxed text-body">{e.summary}</p>

      <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <span className="text-faint">{e.outcome}</span>
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
            <span>{e.author}</span>
          </>
        )}
        {e.seeded && e.source_url && (
          <>
            <span aria-hidden>·</span>
            <a
              href={e.source_url}
              rel="noopener nofollow"
              className="underline underline-offset-4 hover:text-accent"
            >
              {e.source_site ?? "source"}
              {e.source_date ? `, ${e.source_date.slice(0, 4)}` : ""}
            </a>
          </>
        )}
      </p>
    </article>
  );
}
