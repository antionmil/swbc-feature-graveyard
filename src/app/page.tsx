import Link from "next/link";
import { DigButton } from "@/components/DigButton";
import { DigTitle } from "@/components/DigTitle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LiveCount } from "@/components/LiveCount";
import { Wall } from "@/components/Wall";
import { Yard } from "@/components/Yard";
import { heaviest, totals, wall } from "@/lib/entries";
import { bigHours, registry } from "@/lib/toll";

export const revalidate = 60;

export default async function Home() {
  const [rows, top, sum] = await Promise.all([wall(), heaviest(3), totals()]);
  const all = bigHours(sum.hours);

  return (
    <main id="top" className="mx-auto w-full max-w-2xl px-5 pb-14 sm:px-6 sm:pb-20">
      <div className="flex items-center gap-4 pt-8">
        <div className="min-w-0 flex-1">
          <LiveCount />
        </div>
        <ThemeToggle />
      </div>

      {/* The horizon arrives before a word of copy does. */}
      <Yard className="-mx-5 mt-6 mb-14 opacity-90 sm:-mx-6" zombies />

      <header className="flex flex-col gap-5">
        <DigTitle
          text="Feature Graveyard"
          className="text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl"
        />
        <p className="prose-tight max-w-prose text-lg leading-relaxed text-body">
          Things we built that nobody used. Register one and you get a plot, a
          certificate and an hour count — so killing it stops being a thing you
          have to explain.
        </p>
        <DigButton href="/bury">Register a death</DigButton>
        {sum.graves > 0 && (
          <p className="text-sm text-muted">
            <span className="text-ink tabular-nums">{all.n}</span>{" "}
            {all.unit.replace(" of your life", "")} buried across{" "}
            {sum.weighed === sum.graves
              ? `${sum.graves} features`
              : `${sum.weighed} of ${sum.graves} features weighed`}
            .
          </p>
        )}
      </header>

      {top.length > 0 && (
        <section className="mt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">The heaviest tolls</h2>
            <Link href="/heaviest" className="text-sm text-accent underline underline-offset-4">
              See all
            </Link>
          </div>
          <ol className="mt-5 flex flex-col">
            {top.map((r, i) => {
              const h = bigHours(r.hours ?? 0, r.people ?? 1);
              return (
                <li key={r.id}>
                  <Link
                    href={`/g/${r.slug}`}
                    className="flex items-baseline gap-4 border-b border-rule py-3.5 transition-colors hover:border-accent"
                  >
                    <span className="w-5 shrink-0 text-sm text-faint tabular-nums">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-ink">{r.feature}</span>
                    <span className="shrink-0 text-sm font-medium text-accent tabular-nums">{h.n}</span>
                    <span className="shrink-0 text-[10px] tracking-[0.1em] text-faint uppercase">
                      {h.unit.replace(" of your life", "").replace("full-time ", "")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="mt-16 border-t border-rule pt-12">
        <header className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">Everyone buried here</h2>
          <p className="prose-tight max-w-prose text-body">
            Not a ranking — just the pile, so it is a bit less lonely.
          </p>
        </header>
        <Wall rows={rows} />
      </section>

      <Yard className="-mx-5 mt-16 opacity-55 sm:-mx-6" zombies />

      <footer className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-rule pt-8 text-xs text-muted">
        <a href="#top" className="underline underline-offset-4 hover:text-accent">Back to the top</a>
        <span aria-hidden>·</span>
        <Link href="/bury" className="underline underline-offset-4 hover:text-accent">Register a death</Link>
        <span aria-hidden>·</span>
        <Link href="/heaviest" className="underline underline-offset-4 hover:text-accent">Heaviest tolls</Link>
        <span aria-hidden>·</span>
        <a href="https://onedaybuilt.com" className="underline underline-offset-4 hover:text-accent">onedaybuilt.com</a>
      </footer>
    </main>
  );
}
