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

export type Outcome = (typeof OUTCOMES)[number];
export const isOutcome = (v: unknown): v is Outcome =>
  typeof v === "string" && (OUTCOMES as readonly string[]).includes(v);
