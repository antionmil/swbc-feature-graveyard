"use client";

import { useEffect, useState } from "react";
import { subscribe, type Counts } from "@/lib/pulseClient";

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n);

export function LiveCount() {
  const [c, setC] = useState<Counts | null>(null);
  useEffect(() => subscribe(setC), []);

  // Nothing until the first ping answers — an empty pill is worse than none.
  if (!c?.total) return null;

  const stat = (n: number, label: string) => (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-medium text-body tabular-nums">{fmt(n)}</span>
      <span>{label}</span>
    </span>
  );

  return (
    <div className="mx-auto mb-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-full border border-rule px-5 py-2.5 text-xs text-muted">
      {typeof c.online === "number" && c.online > 0 && (
        <span className="inline-flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          {stat(c.online, "here now")}
        </span>
      )}
      {typeof c.week === "number" && stat(c.week, "this week")}
      {stat(c.total, "visitors")}
      {typeof c.views === "number" && c.views > 0 && stat(c.views, "views")}
    </div>
  );
}
