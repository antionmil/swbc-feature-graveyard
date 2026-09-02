"use client";

import { useEffect, useRef, useState } from "react";
import { bigHours, compare, registry } from "@/lib/toll";

/**
 * The burial.
 *
 * A shovel digs in three strokes, the hole widens and deepens with each one,
 * the spoil piles beside it, the feature goes down, the earth goes back, and
 * a stone rises through the mound.
 *
 * The inscription is WRAPPED AND SCALED to the stone rather than trusted to
 * fit — a feature name can be three words or fifteen, and text running off a
 * headstone is the one thing that would break the illusion completely.
 */
type Props = {
  feature: string;
  outcome: string;
  hours: number;
  spend: number | null;
  id: number;
  slug: string;
  people: number;
  onDone?: () => void;
};

/** Greedy wrap to a character budget, then a font size that fits the lines. */
function inscribe(name: string) {
  const words = name.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length <= 22) line = (line + " " + w).trim();
    else {
      if (line) lines.push(line);
      line = w.length > 22 ? w.slice(0, 21) + "…" : w;
    }
  }
  if (line) lines.push(line);
  const kept = lines.slice(0, 3);
  if (lines.length > 3) kept[2] = kept[2].slice(0, 19) + "…";
  const longest = Math.max(...kept.map((l) => l.length));
  const size = longest > 18 ? 7 : longest > 13 ? 8 : 9.5;
  return { lines: kept, size };
}

export function Ceremony({ feature, outcome, hours, spend, id, slug, people, onDone }: Props) {
  const [phase, setPhase] = useState<"run" | "done">("run");
  const [shown, setShown] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const ins = inscribe(feature);
  const big = bigHours(hours, people);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPhase("done");
      setShown(hours);
      onDone?.();
      return;
    }
    /* The stone lands at 7.0s of the 7.2s sequence. The certificate must not
       exist before then — showing it while the shovel is still digging gives
       the ending away and makes the burial feel like a loading screen. */
    const t = setTimeout(() => {
      setPhase("done");
      onDone?.();
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / 1300);
        setShown(Math.round(hours * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, 7050);
    return () => clearTimeout(t);
  }, [hours, onDone]);

  return (
    <div ref={box} className="flex flex-col gap-4">
            {/* The viewBox is cropped to where the action actually is. The scene was
          drawn on a 420x260 canvas but the digging, the stone and the mound all
          sit in a band about 150 tall — the rest was empty sky above and dead
          soil below, which is why the frame felt oversized for its contents. */}
      <div className="ceremony relative overflow-hidden rounded-xl bg-[#0d0f12]">
        <svg viewBox="30 96 360 150" className="block w-full">
          <defs>
            <radialGradient id="cySky" cx="50%" cy="12%" r="90%">
              <stop offset="0" stopColor="#1e242d" />
              <stop offset="0.55" stopColor="#12151a" />
              <stop offset="1" stopColor="#0a0c0f" />
            </radialGradient>
            <linearGradient id="cySoil" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4d4030" />
              <stop offset="1" stopColor="#241d15" />
            </linearGradient>
            <radialGradient id="cyPit" cx="50%" cy="30%" r="70%">
              <stop offset="0" stopColor="#000" />
              <stop offset="1" stopColor="#120e09" />
            </radialGradient>
          </defs>

          <rect width="420" height="260" fill="url(#cySky)" />
          <g className="cy-cam">
            <rect x="0" y="176" width="420" height="84" fill="url(#cySoil)" />
            <rect x="0" y="174" width="420" height="3" fill="#3d4a33" />
            <ellipse className="cy-pit" cx="210" cy="196" rx="0" ry="0" fill="url(#cyPit)" />
            <ellipse className="cy-rim" cx="210" cy="196" rx="0" ry="0" fill="none" stroke="#5a4a37" strokeWidth="2.5" />
            <g className="cy-card">
              <rect x="162" y="150" width="96" height="34" rx="4" fill="#20242a" stroke="#39404a" />
              <rect x="169" y="158" width="60" height="4" rx="2" fill="#cdd2d9" />
              <rect x="169" y="167" width="78" height="3" rx="1.5" fill="#767d88" />
            </g>
            <path className="cy-mound" d="" fill="#3f3527" />

            <g className="cy-stone">
              <path d="M-42 0 V-40 A42 42 0 0 1 42 -40 V0 Z" fill="#333941" transform="translate(210,196)" />
              <path d="M-34 0 V-38 A34 34 0 0 1 34 -38 V0 Z" fill="#2a2f37" transform="translate(210,196)" />
              <g transform="translate(210,196)">
                <text y="-58" textAnchor="middle" fontFamily="serif" fontSize="6" letterSpacing="2.4" fill="#969eaa">
                  HERE LIES
                </text>
                {ins.lines.map((l, i) => (
                  <text
                    key={i}
                    y={-44 + i * (ins.size + 2.5)}
                    textAnchor="middle"
                    fontSize={ins.size}
                    fontWeight="600"
                    fill="#eceae6"
                  >
                    {l}
                  </text>
                ))}
                <text y={-40 + ins.lines.length * (ins.size + 2.5) + 4} textAnchor="middle" fontSize="6.2" fill="#8a919b">
                  {outcome}
                </text>
                <text y="-11" textAnchor="middle" fontSize="5.2" letterSpacing="1.4" fill="#6f7680">
                  DEATH {registry(id)}
                </text>
              </g>
            </g>
            <g className="cy-shovel">
              <rect x="-2.4" y="-64" width="4.8" height="64" rx="2.2" fill="#7d6a4e" />
              <rect x="-8" y="-72" width="16" height="9" rx="3" fill="#6b5a41" />
              <path d="M-11 0 h22 v14 a11 11 0 0 1 -22 0 Z" fill="#aeb6bd" />
            </g>
          </g>
        </svg>
      </div>

      {phase === "done" ? (
        <div className="rise rounded-xl border border-rule bg-surface p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] tracking-[0.18em] text-muted uppercase">Certificate of death</span>
            <span className="text-[10px] tracking-[0.14em] text-faint">{registry(id)}</span>
          </div>
          <p className="mt-3 flex flex-wrap items-baseline gap-x-2.5">
            <span className="text-4xl font-semibold text-accent tabular-nums">
              {hours < 1000 ? shown.toLocaleString() : big.n}
            </span>
            <span className="text-base text-body">{big.unit}</span>
          </p>
          <p className="prose-tight mt-2 text-sm text-body">{compare(hours, people)}</p>
          {spend ? (
            <p className="mt-2 text-sm text-muted">
              Also spent <span className="text-ink">${spend.toLocaleString()}</span>.
            </p>
          ) : null}
          <a
            href={`/g/${slug}`}
            className="mt-4 inline-block text-sm text-accent underline underline-offset-4"
          >
            See the plot
          </a>
        </div>
      ) : null}
    </div>
  );
}
