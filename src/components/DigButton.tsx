"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** The spade drives in, throws a spray of dirt, and only then does the page
 *  change. Half a second — long enough to register, short enough that nobody
 *  waiting to submit resents it. */
const CLODS = [
  { dx: "-26px", dy: "-18px" },
  { dx: "-14px", dy: "-26px" },
  { dx: "6px", dy: "-28px" },
  { dx: "22px", dy: "-20px" },
  { dx: "32px", dy: "-9px" },
];

export function DigButton({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  const [digging, setDigging] = useState(false);

  function go(e: React.MouseEvent) {
    // Let a middle-click or a modified click open a tab as normal.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (digging) return;
    setDigging(true);
    router.prefetch(href);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => router.push(href), reduce ? 0 : 520);
  }

  return (
    <a
      href={href}
      onClick={go}
      className={`dig-btn relative inline-flex items-center gap-2.5 self-start rounded-full bg-accent px-7 py-3.5 text-sm font-medium tracking-[0.04em] text-ground ${
        digging ? "digging" : ""
      }`}
    >
      <span aria-hidden className="spray pointer-events-none absolute bottom-2 left-8">
        {CLODS.map((c, i) => (
          <i
            key={i}
            className="absolute block rounded-full bg-ground/70"
            style={
              {
                width: 4 + (i % 3),
                height: 3 + (i % 2),
                opacity: 0,
                "--dx": c.dx,
                "--dy": c.dy,
                animationDelay: `${i * 28}ms`,
              } as React.CSSProperties
            }
          />
        ))}
      </span>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transformOrigin: "12px 4px" }}>
        <path d="M12 3v11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M8 14h8v3a4 4 0 0 1-8 0z" fill="currentColor" />
        <path d="M9.5 3h5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      {children}
    </a>
  );
}
