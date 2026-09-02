"use client";

export type Counts = { online?: number; week?: number; total?: number; views?: number };

const KEY = "fg.vid";

/** One id per browser, kept locally. Random, tied to nothing, and the only
 *  thing sent — which is what makes "visitors" mean people rather than views. */
export function visitorId() {
  try {
    let v = localStorage.getItem(KEY);
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem(KEY, v);
    }
    return v;
  } catch {
    // Private mode or storage blocked: still counted, as a new visitor.
    return crypto.randomUUID();
  }
}

/* The pings happen once for the whole app, not once per component. The
   counter pill and the view-recorder are in different places in the tree, and
   two independent tickers would double every view. */
let latest: Counts | null = null;
let started = false;
const listeners = new Set<(c: Counts) => void>();

async function send(view: boolean) {
  try {
    const res = await fetch("/api/pulse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sid: visitorId(), view }),
    });
    const d = (await res.json()) as Counts;
    if (typeof d?.total === "number") {
      latest = d;
      listeners.forEach((f) => f(d));
    }
  } catch {
    /* counts are decoration; never surface a failure */
  }
}

export function startPulse() {
  if (started) return;
  started = true;
  send(true); // the view

  /* Every 30 seconds was enough to stop Neon ever auto-suspending: it sleeps
     after five minutes idle, and a single tab left open kept writing forever.
     On the free tier that is the compute budget spent on a counter. Two minutes
     still reads as live, and a tab nobody has touched for twenty stops asking —
     it will start again the moment they do something. */
  let idle = 0;
  const wake = () => { idle = 0; };
  for (const ev of ["pointerdown", "keydown", "scroll", "visibilitychange"]) {
    addEventListener(ev, wake, { passive: true });
  }
  const beat = setInterval(() => {
    if (document.visibilityState !== "visible") return; // not a person sitting there
    if (++idle > 10) { clearInterval(beat); return; }
    send(false);
  }, 120_000);
}

export function subscribe(f: (c: Counts) => void) {
  listeners.add(f);
  if (latest) f(latest);
  // Set.delete returns a boolean; a useEffect cleanup must return nothing.
  return () => {
    listeners.delete(f);
  };
}
