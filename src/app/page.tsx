import Link from "next/link";
import { Wall } from "@/components/Wall";
import { SubmitForm } from "@/components/SubmitForm";
import { wall } from "@/lib/entries";

/* Static, with a 60-second window. The read goes through a cached function and
   the filter runs in the browser, so no uncached fetch happens during render —
   which is what would silently opt this route out of caching entirely. */
export const revalidate = 60;

export default async function Home() {
  const rows = await wall();

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-14 sm:px-6 sm:py-20">
      <header className="flex flex-col gap-4">
        <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
          Feature Graveyard
        </h1>
        <p className="prose-tight max-w-prose text-lg leading-relaxed text-body">
          Things we built that nobody used. Not a ranking, not a postmortem — just
          the pile, so it is a bit less lonely.
        </p>
      </header>

      <Wall rows={rows} />

      <section id="submit" className="mt-20 scroll-mt-8 border-t border-rule pt-12">
        <header className="mb-7 flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">Add one</h2>
          <p className="prose-tight max-w-prose text-body">
            The hours are optional and most people do not remember them. What it
            was and what happened is the whole thing.
          </p>
        </header>
        <SubmitForm />
      </section>

      <footer className="mt-16 border-t border-rule pt-8 text-xs text-muted">
        Built in a day ·{" "}
        <Link href="https://onedaybuilt.com" className="underline underline-offset-4 hover:text-accent">
          onedaybuilt.com
        </Link>
      </footer>
    </main>
  );
}
