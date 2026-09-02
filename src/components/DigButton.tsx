"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * The button becomes a headstone.
 *
 * Three attempts at "it falls into a hole" all read as a button moving
 * downward, because that is all it was. This is a different idea: the pill
 * squares off at the bottom, arches at the top, grows taller, and the label
 * turns into HERE LIES — the control turns into the thing it is for, and
 * *then* the page changes.
 *
 * It is one element morphing, so every frame is a real intermediate state
 * rather than a sprite swap.
 */
export function DigButton({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "sinking">("idle");

  function go(e: React.MouseEvent) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (phase !== "idle") return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    router.prefetch(href);
    if (reduce) return void router.push(href);
    setPhase("sinking");
    setTimeout(() => router.push(href), 160);
  }

  return (
    <span className="relative inline-block self-start">
      <a
        href={href}
        onClick={go}
        className={`stone-btn relative z-10 inline-flex items-center gap-2.5 rounded-full bg-accent px-7 py-3.5 text-sm font-medium tracking-[0.04em] text-ground ${
          phase === "sinking" ? "carving" : ""
        }`}
      >
        <span className="dig-btn inline-flex items-center gap-2.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3v11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M8 14h8v3a4 4 0 0 1-8 0z" fill="currentColor" />
            <path d="M9.5 3h5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          {children}
        </span>

      </a>

    </span>
  );
}
