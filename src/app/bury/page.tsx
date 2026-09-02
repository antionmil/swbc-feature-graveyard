import type { Metadata } from "next";
import Link from "next/link";
import { SubmitForm } from "@/components/SubmitForm";

export const metadata: Metadata = {
  title: "Bury a feature — Feature Graveyard",
  description: "Register the death of something you built that nobody used.",
};

export default function Bury() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-14 sm:px-6 sm:py-20">
      <Link href="/" className="text-sm text-muted underline underline-offset-4 hover:text-accent">
        ← The graveyard
      </Link>

      <header className="mt-8 flex flex-col gap-4">
        <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
          Register a death
        </h1>
        <p className="prose-tight max-w-prose text-lg leading-relaxed text-body">
          Something you built that nobody used. You get a plot with a link and a
          certificate — paste it wherever the decision needs to land, and it stops
          being a thing you have to explain.
        </p>
      </header>

      <div className="mt-9">
        {/* The screenshot field only appears if the blob store is actually
            wired. Without the token every visitor who picked a file got a raw
            SDK error on the page, under a line promising "PNG, JPEG, WebP or
            GIF, up to 5 MB" — the one media feature on the site, visibly broken
            for everyone. Offering it conditionally is better than offering it
            and failing. */}
        <SubmitForm canUpload={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} />
      </div>
    </main>
  );
}
