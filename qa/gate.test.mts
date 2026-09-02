import { checkGate } from "../src/lib/ratelimit";

/* This file used to assert a per-IP daily cap by firing five calls from one
   address and printing "limit is per IP". That cap was removed — a first-time
   visitor was being turned away — and the test kept printing the claim, which
   is the project's own rule ("anything meant to PREVENT something must be
   tested by attempting it") running backwards: a green line for a control that
   no longer exists, in a public repo.
   
   What is actually true now: there is no per-person limit, and the only gate is
   a global daily ceiling that exists so a runaway script cannot become a bill.
   So that is what this attempts. */
const req = (ip: string) => new Request("http://x", { headers: { "x-forwarded-for": ip } });
const label = (g: Awaited<ReturnType<typeof checkGate>>) =>
  g.ok ? "allowed" : `BLOCKED (${g.reason})`;

console.log(`ceiling = ${process.env.DAILY_GENERATION_CEILING ?? "(default 20000)"}`);

let allowed = 0;
for (let i = 1; i <= 25; i++) {
  const g = await checkGate(req("1.2.3.4"));
  if (g.ok) allowed++;
}
console.log(`  25 burials from one address: ${allowed} allowed`);
console.log(`  expected 25 — there is no per-person cap. ${allowed === 25 ? "PASS" : "FAIL"}`);

console.log(`  a different address        : ${label(await checkGate(req("9.9.9.9")))}`);
console.log(`  the ceiling is global, so it is not a per-address control at all.`);
