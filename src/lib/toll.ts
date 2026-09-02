/**
 * What it cost, in the only currency an indie hacker actually has.
 *
 * Hours, not dollars. "3 people x 5 months" describes a company; the people
 * who will use this are one person, six weeks, evenings and weekends — and
 * money understates that badly while hours capture it exactly.
 *
 * The effort question is the one no other site thinks to ask, and it matters
 * more than the duration: full-time versus nights-and-weekends changes the
 * real number by a factor of eight.
 */
export const EFFORTS = [
  { id: "fulltime", label: "full-time", hoursPerWeek: 40, blurb: "it was the job" },
  { id: "most", label: "most of my time", hoursPerWeek: 25, blurb: "around other work" },
  { id: "evenings", label: "evenings and weekends", hoursPerWeek: 15, blurb: "after hours" },
  { id: "here", label: "here and there", hoursPerWeek: 5, blurb: "whenever there was time" },
] as const;

export type EffortId = (typeof EFFORTS)[number]["id"];
export const isEffort = (v: unknown): v is EffortId =>
  typeof v === "string" && EFFORTS.some((e) => e.id === v);

export const effortOf = (id: string) => EFFORTS.find((e) => e.id === id) ?? EFFORTS[2];

/** Stored, not computed on read, so the leaderboard can sort on it. */
export function hoursOf(people: number, weeks: number, effort: string) {
  const rate = effortOf(effort).hoursPerWeek;
  return Math.max(1, Math.round(people * weeks * rate));
}

/** Said back in a way you feel. Never a second number — one comparison, in
 *  units a person can picture. */
export function compare(hours: number): string {
  const ftWeeks = hours / 40;
  if (hours < 40) return `Less than a working week — but a week you did not get back.`;
  if (ftWeeks < 4) return `${Math.round(ftWeeks)} full-time weeks. A month of Mondays.`;
  if (ftWeeks < 13) return `${Math.round(ftWeeks)} full-time weeks. A whole quarter of evenings.`;
  if (ftWeeks < 52) return `${Math.round(ftWeeks / 4.33)} full-time months. Long enough to have learned something else entirely.`;
  const years = ftWeeks / 52;
  return `${years.toFixed(1)} full-time years. That is a chapter of a career.`;
}

/** "312 hours" reads flat past a few hundred. */
export function bigHours(hours: number) {
  if (hours < 1000) return { n: hours.toLocaleString(), unit: "hours of your life" };
  return { n: (hours / 40).toFixed(0), unit: "full-time weeks of your life" };
}

export const registry = (id: number) => `NO. ${String(id).padStart(4, "0")}`;
