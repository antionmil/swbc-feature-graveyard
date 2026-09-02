"use client";

import { useEffect } from "react";
import Link from "next/link";

/* Every read helper in lib/entries.ts catches and returns empty, so a database
   outage renders a quiet empty page — but nothing caught a throw during RENDER,
   and a single malformed row would white-screen the route behind Next's stock
   error page. This is the floor under that. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[render] failed", error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-5 pt-16 pb-20 sm:px-6">
      <p className="text-[10px] tracking-[0.24em] text-faint uppercase">Something gave way</p>
      <h1 className="mt-4 text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
        The ground shifted
      </h1>
      <p className="prose-tight mt-5 max-w-prose text-lg leading-relaxed text-body">
        This page did not render. Nothing you did caused it and nothing was lost.
      </p>
      <p className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          onClick={reset}
          className="rounded-full border border-edge px-5 py-2.5 text-sm text-body transition-colors hover:border-accent hover:text-accent"
        >
          Try again
        </button>
        <Link href="/" className="text-sm text-accent underline underline-offset-4">
          Back to the graveyard
        </Link>
      </p>
      {error.digest && (
        <p className="mt-8 text-xs text-faint">Reference {error.digest}</p>
      )}
    </main>
  );
}
