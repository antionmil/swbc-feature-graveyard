import type { Metadata } from "next";
import Link from "next/link";
import { Yard } from "@/components/Yard";
import { lessons, totals } from "@/lib/entries";
import { authorLink } from "@/lib/outcomes";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "What we have learned — Feature Graveyard",
  description:
    "The part worth keeping: what each person concluded from the thing they buried, retold here and linked back to what they wrote.",
};

export default async function Lessons() {
  const [rows, sum] = await Promise.all([lessons(), totals()]);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-16 sm:px-6 sm:pb-24">
      <p className="pt-6">
        <Link href="/" className="text-sm text-muted underline underline-offset-4 hover:text-accent">
          ← The graveyard
        </Link>
      </p>

      <header className="mt-8 flex flex-col gap-5">
        <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
          What we have learned
        </h1>
        <p className="prose-tight max-w-prose text-lg leading-relaxed text-body">
          Anyone can collect failures. The part worth keeping is what the person
          who lived through one would tell you before you start the same thing.
          Each of these is our reading of what they wrote, with their words a
          click away.
        </p>
        {/* The count is the honest one: not every burial comes with a lesson,
            and saying so is cheaper than pretending they all do. */}
        <p className="prose-tight max-w-prose text-sm text-muted">
          {rows.length} of the {sum.graves} buried here came with one. The rest
          are a story without a moral, which is also how it goes.
        </p>
      </header>

      <Yard className="-mx-5 mt-10 opacity-50 sm:-mx-6" />

      {rows.length === 0 ? (
        <p className="mt-12 text-body">
          Nothing yet.{" "}
          <Link href="/bury" className="text-accent underline underline-offset-4">
            Bury something and say what it taught you.
          </Link>
        </p>
      ) : (
        <ol className="mt-12 flex flex-col gap-12">
          {rows.map((g) => {
            const who = g.author ?? g.source_author ?? null;
            const link = authorLink(g.author_url);
            return (
              <li key={g.id} className="border-l-2 border-accent pl-5 sm:pl-6">
                {/* The lesson leads. On the wall it sits under the story
                    because the story is the point there; here it is the
                    other way round, and the story is the citation. */}
                {/* Not a <blockquote>. These are our summaries of what each
                    person concluded, not their sentences, and quote marks under
                    a real name are a claim about who said what. */}
                <p className="prose-tight text-lg leading-relaxed text-ink sm:text-xl">
                  {g.lesson}
                </p>
                <p className="mt-4 text-sm text-muted">
                  <Link
                    href={`/g/${g.slug}`}
                    className="text-body underline underline-offset-4 hover:text-accent"
                  >
                    {g.feature}
                  </Link>
                  {who ? (
                    <>
                      {" · "}
                      {link ? (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener nofollow"
                          className="underline underline-offset-4 hover:text-accent"
                        >
                          {who}
                        </a>
                      ) : (
                        who
                      )}
                    </>
                  ) : null}
                  {g.source_date ? ` · ${g.source_date.slice(0, 4)}` : ""}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      <section className="mt-16 border-t border-rule pt-10">
        <p className="prose-tight max-w-prose text-body">
          Got one of your own?{" "}
          <Link href="/bury" className="text-accent underline underline-offset-4">
            Register the death
          </Link>{" "}
          and say what you would tell somebody about to do the same.
        </p>
      </section>

      <footer className="mt-12 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-rule pt-8 text-xs text-muted">
        <Link href="/" className="underline underline-offset-4 hover:text-accent">The graveyard</Link>
        <span aria-hidden>·</span>
        <Link href="/heaviest" className="underline underline-offset-4 hover:text-accent">Heaviest tolls</Link>
        <span aria-hidden>·</span>
        <Link href="/bury" className="underline underline-offset-4 hover:text-accent">Register a death</Link>
        <span aria-hidden>·</span>
        <a href="https://github.com/antionmil/swbc-feature-graveyard/issues/new?title=Please%20remove%20my%20entry" target="_blank" rel="noopener nofollow" className="underline underline-offset-4 hover:text-accent">Ask us to take something down</a>
      </footer>
    </main>
  );
}
