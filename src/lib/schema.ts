import { pgTable, text, integer, index, serial, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";

/**
 * One table for the wall.
 *
 * Seeded entries and submitted ones live together, distinguished by `seeded`,
 * because the wall renders them identically and nothing downstream needs to
 * tell them apart except the attribution line.
 *
 * `time_spent` is TEXT and nullable on purpose. People say "about three
 * weeks", "four years", "two sprints" — a number would force a precision
 * nobody has, and eleven of the thirteen seeds have no figure at all. An
 * invented duration is the single thing that would sink this site.
 */
export const graves = pgTable("graves", {
  id: serial("id").primaryKey(),
  feature: text("feature").notNull(),        // what was built
  summary: text("summary").notNull(),        // what happened to it
  outcome: text("outcome").notNull(),        // abandoned | unused | no demand | ...
  time_spent: text("time_spent"),            // free text, often null
  author: text("author"),                    // optional, how they want to be credited
  author_url: text("author_url"),            // optional, normalised to a known host

  // Attribution for seeded entries. The summaries are written fresh in neutral
  // voice — the original words are never reproduced, the thread is linked.
  seeded: boolean("seeded").notNull().default(false),
  source_url: text("source_url"),
  source_site: text("source_site"),
  source_author: text("source_author"),
  source_date: text("source_date"),

  /* A screenshot of the thing. Optional, and most people will not have one of
     something they killed three years ago. Uploaded to blob storage, so this
     is a URL we issued — never a URL somebody typed, which would be a
     tracking and abuse vector pointed at our own readers. */
  image_url: text("image_url"),

  /* The public identifier. Short, random and url-safe rather than the serial
     id, so a plot cannot be guessed by counting and nobody can tell how many
     submissions were rejected. */
  slug: text("slug").notNull().unique(),

  status: text("status").notNull().default("pending"), // pending | approved | rejected
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("graves_status_idx").on(t.status, t.created_at),
  index("graves_outcome_idx").on(t.outcome),
]);

/** Rate-limit counters.
 *  `bucket` is the PRIMARY KEY, not a plain column. That is load-bearing:
 *  the counter is a single atomic INSERT .. ON CONFLICT DO UPDATE, and
 *  without the uniqueness there is no conflict to catch, every call inserts
 *  a fresh row, every count comes back as 1, and BOTH the per-IP limit and
 *  the global daily ceiling silently never fire. */
export const events = pgTable("events", {
  bucket: text("bucket").primaryKey(),
  n: integer("n").notNull().default(0),
  day: text("day").notNull(),
}, (t) => [index("events_day_idx").on(t.day)]);

/** Visitor counts. One random id per browser, generated client-side and kept
 *  in localStorage. No IP address, no user agent, no referrer — nothing here
 *  identifies a person, and that is also what makes "visitors" mean people
 *  rather than page views. */
export const visitors = pgTable("visitors", {
  sid: text("sid").primaryKey(),
  first_seen: timestamp("first_seen", { withTimezone: true }).notNull().defaultNow(),
  last_seen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("visitors_last_seen_idx").on(t.last_seen)]);

/** Page views, and anything else worth a running total. */
export const counters = pgTable("counters", {
  key: text("key").primaryKey(),
  n: integer("n").notNull().default(0),
});

/** Stones left on a grave.
 *
 *  The primary key is the PAIR, which is the whole mechanic: one stone per
 *  visitor per grave, enforced by the database rather than by remembering to
 *  check. Without it this is a click counter and the number means nothing.
 *
 *  `sid` is the same random browser id the visitor counter uses — no account,
 *  and a stone can be lifted back off. */
export const stones = pgTable("stones", {
  grave_id: integer("grave_id").notNull(),
  sid: text("sid").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.grave_id, t.sid] }),
  index("stones_grave_idx").on(t.grave_id),
]);
