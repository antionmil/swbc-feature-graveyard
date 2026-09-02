# Feature Graveyard

Things we built that nobody used. A wall of confessions — what it was, what
happened to it — with a form to add your own.

Day 2 of a 26-day [one-website-a-day run](https://onedaybuilt.com).

## The idea

Every postmortem is written to be useful. This one is not: it is the pile of
things that went nowhere, so it is a bit less lonely.

Ranked by nothing. Filtered by what happened — abandoned, shipped and unused,
no demand, no traction, removed, replaced.

## Decisions worth not re-litigating

- **The story leads, the duration is a footnote.** Leading with hours would
  make this a cost counter, and eleven of the thirteen seeded entries have no
  duration at all. `time_spent` is nullable TEXT — people say "about three
  weeks", not `3`.
- **Nothing appears unread.** Submissions land as `pending`; the wall reads
  only `approved`. Moderation is one page behind one env var — no accounts.
- **The filter runs in the browser.** Filtering server-side meant reading
  `searchParams`, which makes the page dynamic — a database query on every
  view, and Neon scales to zero after five minutes idle. The wall is capped at
  200 rows, so it is fetched once through a cached function and filtered
  client-side. The page caches and a chip click costs nothing.
- **The outcome list is fixed, not free text.** Otherwise the same thing
  arrives as "unused", "no one used it" and "nobody used it", and the filter
  stops meaning anything.
- **Seeded summaries are written fresh, in neutral voice.** The authors' own
  words are not reproduced — publishing someone's comment wholesale on a
  public wall is not ours to do. The thread is linked instead, with the author
  and date.
- **`pnpm seed` refuses to insert unverified entries.** Every seed has to be
  read against its own source thread first. It also maps near-duplicate
  outcome labels explicitly and prints what it changed, rather than silently
  rewriting them.

## Setup

    cp .env.example .env.local     # DATABASE_URL, ADMIN_PASSWORD
    pnpm install
    pnpm db:push                   # create the tables
    pnpm seed                      # dry run — lists what it would insert
    pnpm seed --write
    pnpm dev

Neon, free plan, Frankfurt — `vercel.json` pins the functions to `fra1` so
the database and the functions sit in the same region. Supabase is not used here: its free plan allows only two
active projects and a 26-site run needs more.

Moderation queue: `/admin?k=<ADMIN_PASSWORD>`.

Not affiliated with anyone whose thread is linked.
