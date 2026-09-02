import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Replay } from "@/components/Replay";
import { Stones } from "@/components/Stones";
import { grave, stoneCount } from "@/lib/entries";
import { authorLink } from "@/lib/outcomes";
import { isSlug } from "@/lib/slug";

export const revalidate = 60;

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

  const { total } = await stoneCount(g.id);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-14 sm:px-6 sm:py-20">
      <Link href="/" className="text-sm text-muted underline underline-offset-4 hover:text-accent">
        ← The graveyard
      </Link>

      {g.status !== "approved" && (
        <p className="mt-8 rounded-lg border border-rule bg-surface px-4 py-3 text-sm text-body">
          This plot is yours, and the link works. It appears on the wall once it
          has been read — everything here is, which is what keeps it worth
          reading.
        </p>
      )}

      <article className="mt-8">
        <p className="text-xs tracking-[0.16em] text-muted uppercase">
          {g.outcome}
          {g.time_spent ? ` · ${g.time_spent}` : ""}
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          {g.feature}
        </h1>
        <p className="prose-tight mt-5 text-lg leading-relaxed text-body">{g.summary}</p>

        {g.image_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={g.image_url}
            alt={`A screenshot of ${g.feature}`}
            className="mt-7 w-full rounded-lg border border-rule"
            loading="lazy"
          />
        )}

        <Replay
          feature={g.feature}
          outcome={g.outcome}
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
            {g.source_date ? `, ${g.source_date.slice(0, 4)}` : ""}. Summarised here, not quoted.
          </p>
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
        <Link href="/#submit" className="underline underline-offset-4 hover:text-accent">
          Bury one of yours
        </Link>
      </footer>
    </main>
  );
}
