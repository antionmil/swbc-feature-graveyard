import Link from "next/link";
import { Yard } from "@/components/Yard";

/* Next's stock 404 is a client-rendered black-on-white box with no link out of
   it — so a mistyped or stale plot link, on a site whose whole distribution is
   pasted links, was a dead end that also flashed the wrong theme. This one is
   server-rendered, so it exists with JS off, and it carries a way back. */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-5 pt-16 pb-20 sm:px-6">
      <p className="text-[10px] tracking-[0.24em] text-faint uppercase">No such plot</p>
      <h1 className="mt-4 text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
        Nothing is buried here
      </h1>
      <p className="prose-tight mt-5 max-w-prose text-lg leading-relaxed text-body">
        That link points at a plot that does not exist. It may have been mistyped,
        or the burial may have been taken down at its author&rsquo;s request.
      </p>
      <Yard className="-mx-5 mt-10 opacity-50 sm:-mx-6" />
      <p className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href="/"
          className="rounded-full border border-edge px-5 py-2.5 text-sm text-body transition-colors hover:border-accent hover:text-accent"
        >
          The graveyard
        </Link>
        <Link href="/bury" className="text-sm text-accent underline underline-offset-4">
          Bury one of yours
        </Link>
        <Link href="/lessons" className="text-sm text-muted underline underline-offset-4 hover:text-accent">
          What we have learned
        </Link>
      </p>
    </main>
  );
}
