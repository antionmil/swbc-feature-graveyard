"use client";

import { useState } from "react";
import { Ceremony } from "@/components/Ceremony";

/** Watch the burial again. Someone who registered a death can come back to
 *  their plot and see it; anyone who follows the link can see what happened. */
export function Replay(p: {
  feature: string;
  outcome: string;
  hours: number;
  spend: number | null;
  people: number;
  id: number;
  slug: string;
}) {
  const [n, setN] = useState(0);

  if (!p.hours) return null;

  return (
    <div className="mt-8">
      {n === 0 ? (
        <button
          onClick={() => setN(1)}
          className="rounded-full border border-edge px-5 py-2.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          Watch the burial
        </button>
      ) : (
        <>
          <Ceremony key={n} {...p} />
          <button
            onClick={() => setN((x) => x + 1)}
            className="mt-4 text-sm text-muted underline underline-offset-4 hover:text-accent"
          >
            Again
          </button>
        </>
      )}
    </div>
  );
}
