import Link from "next/link";
import { Wall } from "@/components/Wall";
import { LiveCount } from "@/components/LiveCount";
import { SubmitForm } from "@/components/SubmitForm";
import { wall } from "@/lib/entries";

/* Static, with a 60-second window. The read goes through a cached function and
   the filter runs in the browser, so no uncached fetch happens during render —
   which is what would silently opt this route out of caching entirely. */
export const revalidate = 60;

export default async function Home() {
  const rows = await wall();

  /* Burying comes first. The site's job is to make killing a feature easy to
     do and easy to justify — reading other people's is the second reason to
     be here, not the first. */
  return (
    <main id="top" className="mx-auto w-full max-w-2xl px-5 py-14 sm:px-6 sm:py-20">
      <LiveCount />

      <header className="flex flex-col gap-4">
        <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
          Bury a feature
        </h1>
        <p className="prose-tight max-w-prose text-lg leading-relaxed text-body">
          Something you built that nobody used. You get a plot with a link — paste
          it wherever the decision needs to land, and it stops being a thing you
          have to explain.
        </p>
      </header>

      <section id="submit" className="mt-9 scroll-mt-8">
        <SubmitForm />
      </section>

      <section className="mt-20 border-t border-rule pt-12">
        <header className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">The graveyard</h2>
          <p className="prose-tight max-w-prose text-body">
            Everything buried so far. Not a ranking — just the pile, so it is a
            bit less lonely.
          </p>
        </header>

        <Wall rows={rows} />
      </section>

      <footer className="mt-16 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-rule pt-8 text-xs text-muted">
        <a href="#top" className="underline underline-offset-4 hover:text-accent">
          Back to the top
        </a>
        <span aria-hidden>·</span>
        <span>Built in a day</span>
        <span aria-hidden>·</span>{" "}
        <a href="https://onedaybuilt.com" className="underline underline-offset-4 hover:text-accent">
          onedaybuilt.com
        </a>
      </footer>
    </main>
  );
}
