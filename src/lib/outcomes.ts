/**
 * Shared by the browser and the server, so this file must NOT be server-only.
 *
 * The list lived in `entries.ts` next to the database reads, which carry an
 * `import "server-only"` guard — and the submit form is a client component.
 * The build failed rather than shipping it, which is what that guard is for.
 *
 * Fixed, not free text: a submitter picking from a list keeps the filter
 * meaningful and stops the same outcome arriving as "unused", "no one used
 * it" and "nobody used it".
 */
export const OUTCOMES = [
  "abandoned",
  "shipped, unused",
  "no demand",
  "no traction",
  "removed",
  "replaced",
] as const;

/** The value the form posts when none of the six fit. Never stored — the
 *  free-text answer replaces it, so the wall shows what the person actually
 *  wrote rather than a bucket they were pushed into. */
export const OTHER = "other";

/** Hard cap on a self-written outcome. */
export const MAX_OUTCOME = 20;

export type Outcome = (typeof OUTCOMES)[number];
export const isOutcome = (v: unknown): v is Outcome =>
  typeof v === "string" && (OUTCOMES as readonly string[]).includes(v);

/** Accepted on submission: one of the six, or anything short and sane the
 *  person typed themselves. Lowercased so "Unused" and "unused" are one tag. */
export function cleanOutcome(picked: unknown, custom: unknown): string | null {
  if (isOutcome(picked)) return picked;
  if (picked !== OTHER) return null;
  /* 20 characters. It sits inside a filter chip next to five other chips —
     anything longer wraps the row and pushes the wall down the page. The
     longest built-in, "shipped, unused", is 15. */
  const v = typeof custom === "string" ? custom.trim().toLowerCase().slice(0, MAX_OUTCOME) : "";
  // Letters, spaces, commas and hyphens. A filter chip is not a place for markup.
  return /^[a-z][a-z ,-]{1,19}$/.test(v) ? v : null;
}
