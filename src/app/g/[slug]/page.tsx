import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Replay } from "@/components/Replay";
import { Stones } from "@/components/Stones";
import { grave, stoneCount, slugs } from "@/lib/entries";
import { authorLink } from "@/lib/outcomes";
import { money } from "@/lib/toll";
import { isSlug } from "@/lib/slug";

export const revalidate = 60;

/* Without this the segment is server-rendered on every request, whatever
   `revalidate` says — see the note on `slugs` in lib/entries.ts. */
export async function generateStaticParams() {
  return slugs();
}

const SITE = "https://featuregraveyard.onedaybuilt.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isSlug(slug)) return { title: "Not found" };
  const g = await grave(slug);
  if (!g) return { title: "Not found" };

  /* The card IS the artifact. Pasting this link into Slack is the whole point
     of the plot existing, so the unfurl has to carry the story on its own. */
  const title = g.feature;
  const description = g.summary.slice(0, 180);
  const images = [{ url: `${SITE}/g/${slug}/card`, width: 1200, height: 630, alt: title }];
  /* Taken down. No title, no description, no card — the page 404s below, and
     the metadata must not outlive it in somebody's unfurl cache. */
  if (g.status !== "approved") {
    return { title: "Not found", robots: { index: false, follow: false } };
  }

  return {
    title: `${title} — Feature Graveyard`,
    description,
    openGraph: { title, description, images, type: "article" },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function Grave({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();

  const g = await grave(slug);
  if (!g) notFound();
  /* Burials are live the moment they are made, so the only way a plot is not
     approved is that it was taken down. That has to actually remove it, link
     or no link. */
  if (g.status !== "approved") notFound();

  const { total } = await stoneCount(g.id);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-14 sm:px-6 sm:py-20">
      <Link href="/" className="text-sm text-muted underline underline-offset-4 hover:text-accent">
        ← The graveyard
      </Link>


      <article className="mt-8">
        <p className="text-xs tracking-[0.16em] text-muted uppercase">
          {g.outcome}
          {g.time_spent ? ` · ${g.time_spent}` : ""}
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          {g.feature}
        </h1>
        <p className="prose-tight mt-5 text-lg leading-relaxed text-body">{g.summary}</p>

        {g.lesson && (
          <aside className="mt-7 border-l-2 border-accent pl-5">
            <h2 className="text-[10px] font-bold tracking-[0.24em] text-accent uppercase">
              What to take from it
            </h2>
            <p className="prose-tight mt-2 leading-relaxed text-ink/85">{g.lesson}</p>
          </aside>
        )}

        {g.image_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={g.image_url}
            alt={`A screenshot of ${g.feature}`}
            className="mt-7 w-full rounded-lg border border-rule"
            loading="lazy"
          />
        )}

        {g.spend || g.spend_est ? (
          <p className="mt-6 text-sm text-muted">
            {g.spend ? (
              <>
                Also spent <span className="text-ink">${g.spend.toLocaleString()}</span>.
              </>
            ) : (
              <>
                Nobody said what it cost. Our estimate is{" "}
                <span className="text-ink">{money(g).text}</span>
                {g.spend_est_note ? (
                  <span className="text-faint"> — {g.spend_est_note}</span>
                ) : null}
              </>
            )}
          </p>
        ) : null}

        <Replay
          feature={g.feature}
          outcome={g.outcome}
          author={g.author ?? g.source_author ?? null}
          hours={g.hours ?? 0}
          spend={g.spend}
          people={g.people ?? 1}
          id={g.id}
          slug={g.slug}
        />

        <div className="mt-8 border-t border-rule pt-6">
          <Stones graveId={g.id} initial={total} />
        </div>

        {g.seeded && g.source_url && (
          <p className="mt-6 text-xs text-muted">
            Told by {g.source_author} on{" "}
            <a href={g.source_url} target="_blank" rel="noopener nofollow" className="underline underline-offset-4">
              {g.source_site}
            </a>
            {g.source_date
              ? `, ${new Date(g.source_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
              : ""}
            . Retold here in our words, with
            some of theirs kept; the original is linked above.
          </p>
        )}

        {g.seeded && (
          <>
        {/* The site names real people beside the thing they wrote about
            failing. Some of them will not want that, and until now there was
            no way for any of them to say so — which is the message the owner
            would have received instead. */}
        <p className="mt-2 text-xs text-faint">
          Written by them, summarised by us, and linked back.{" "}
          <a
            href="https://github.com/antionmil/swbc-feature-graveyard/issues/new?title=Please%20remove%20my%20entry"
            target="_blank"
            rel="noopener nofollow"
            className="underline underline-offset-4 hover:text-accent"
          >
            Ask us to take it down
          </a>{" "}
          and we will, no questions.
        </p>
          </>
        )}
        {!g.seeded && g.author && (
          <p className="mt-6 text-xs text-muted">
            Buried by{" "}
            {authorLink(g.author_url) ? (
              <a
                href={authorLink(g.author_url)!.url}
                target="_blank" rel="noopener nofollow"
                className="text-body underline underline-offset-4 hover:text-accent"
              >
                {g.author}
              </a>
            ) : (
              <span className="text-body">{g.author}</span>
            )}
            .
          </p>
        )}
      </article>

      <footer className="mt-14 border-t border-rule pt-8 text-xs text-muted">
        <Link href="/bury" className="underline underline-offset-4 hover:text-accent">
          Bury one of yours
        </Link>
      </footer>
    </main>
  );
}
