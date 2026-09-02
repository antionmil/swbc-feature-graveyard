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
  { id: "odd", label: "the odd evening", hoursPerWeek: 3, blurb: "a couple of sittings a week" },
  { id: "scraps", label: "in scraps", hoursPerWeek: 1, blurb: "an hour here, an hour there" },
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

/**
 * Said back in a way you feel. One comparison, in units a person can picture.
 *
 * The unit changes with the team size, and that is not pedantry: three people
 * for twenty weeks is 1.2 PERSON-years, not 1.2 years of anybody's life, and
 * saying "of your life" to someone who led a team of three is simply wrong.
 */
export function compare(hours: number, people = 1): string {
  const w = hours / 40;
  const each = people > 1 ? "person-" : "";
  if (hours < 40) return "Less than a working week — but a week nobody got back.";
  if (w < 4) return `${Math.round(w)} full-time ${each}weeks. A month of Mondays.`;
  if (w < 13) return `${Math.round(w)} full-time ${each}weeks. A whole quarter of them.`;
  if (w < 52)
    return `${Math.round(w / 4.33)} full-time ${each}months. Long enough to have learned something else entirely.`;
  return `${(w / 52).toFixed(1)} full-time ${each}years. That is a chapter of a career.`;
}

/** "312 hours" reads flat past a few hundred, so it switches unit — and the
 *  possessive drops away as soon as more than one person is involved. */
export function bigHours(hours: number, people = 1) {
  const mine = people > 1 ? "" : " of your life";
  const each = people > 1 ? "person-" : "";
  if (hours < 1000) return { n: hours.toLocaleString(), unit: `${each}hours${mine}` };
  return { n: Math.round(hours / 40).toLocaleString(), unit: `full-time ${each}weeks${mine}` };
}

export const registry = (id: number) => `NO. ${String(id).padStart(4, "0")}`;


/**
 * What to show in a money column.
 *
 * Three states, and the site has to be able to tell them apart out loud:
 * a figure the author gave, an estimate with its working shown, and nothing.
 * The estimate is never rendered like a stated figure — it carries the ≈ and
 * the word "est." wherever it appears, because a number nobody said, printed
 * as though somebody did, is the definition of a fabricated metric.
 */
export function money(g: { spend: number | null; spend_est?: number | null }) {
  if (g.spend) return { text: `$${g.spend.toLocaleString()}`, estimated: false as const };
  if (g.spend_est) return { text: `≈ $${g.spend_est.toLocaleString()}`, estimated: true as const };
  return { text: "not said", estimated: false as const };
}
