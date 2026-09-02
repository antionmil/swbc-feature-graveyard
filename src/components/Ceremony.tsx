"use client";

import { useEffect, useRef, useState } from "react";
import { bigHours, compare, registry } from "@/lib/toll";

/**
 * The burial.
 *
 * Somebody digs the grave. That is the whole difference between this and the
 * version before it — a shovel moving on its own is a clip-art loop, and a
 * hooded figure leaning into three strokes is a scene. Everything else follows
 * from having a body in the frame: the earth he throws has to land somewhere,
 * so there is a spoil heap; he has to face the heap to fill the grave back in,
 * so he turns around; the hole he opens has to have a far wall and a floor,
 * because a flat black ellipse reads as a stain on the ground.
 *
 * Staging, in viewBox units, ground at y=150:
 *
 *     grave 170      digger 228      heap 296
 *        ▽               ☗              ▲
 *   ───────────────────────────────────────────
 *
 * He starts facing left, opens the grave, and throws the earth back over his
 * shoulder onto the heap. The feature goes down. He turns on the spot and
 * puts the earth back. The stone comes up through the mound.
 *
 * The timings are one 9s CSS sequence rather than a JS state machine, so the
 * whole thing stops honestly under prefers-reduced-motion instead of
 * half-running.
 */
type Props = {
  feature: string;
  /** On the certificate, not carved — callers keep passing it. */
  outcome?: string;
  hours: number;
  spend: number | null;
  id: number;
  slug: string;
  people: number;
  onDone?: () => void;
};

const RUN = 9000;

/**
 * Fit the name to the stone.
 *
 * The old version wrapped at a fixed 22 characters and then picked one of
 * three sizes, which is backwards — 22 characters at 8px is 96 units wide on
 * a stone with 66 units of room, so long names ran off the edges. Now the
 * wrap is narrow and the size is computed from the longest line it produced,
 * so the text cannot overflow whatever the name is.
 */
function inscribe(name: string, width = 58) {
  const words = name.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length <= 16) line = (line + " " + w).trim();
    else {
      if (line) lines.push(line);
      line = w.length > 16 ? w.slice(0, 15) + "…" : w;
    }
  }
  if (line) lines.push(line);
  const kept = lines.slice(0, 3);
  if (lines.length > 3) kept[2] = kept[2].slice(0, 14) + "…";
  const longest = Math.max(1, ...kept.map((l) => l.length));
  // 0.56em is about the average advance of the UI face at these weights.
  const size = Math.max(5, Math.min(8.6, width / (longest * 0.56)));
  return { lines: kept, size: Number(size.toFixed(2)) };
}

/** Earth in flight. Fixed values, not random — the same burial every time. */
type Clump = { at: number; x: number; y: number; dx: number; dy: number; peak: number; spin: number; s: number };
/* He faces the grave and heaves the earth back over his shoulder, so on the
   way out it travels RIGHT onto the heap; after he turns around it travels
   LEFT back into the grave. Both leave the blade mid-swing, near (250,118),
   because that is where the blade is when the arm is halfway up. */
const throwOut = (at: number, i: number): Clump[] =>
  [
    { dx: 64, peak: -22, spin: -260, s: 1.0, y: 0 },
    { dx: 50, peak: -30, spin: 200, s: 0.7, y: -4 },
    { dx: 76, peak: -14, spin: -180, s: 0.55, y: 3 },
    { dx: 58, peak: -36, spin: 320, s: 0.45, y: -7 },
  ].map((c, k) => ({
    at: at + k * 0.5,
    x: 226 + i * 2,
    y: 94 + c.y,
    dx: c.dx,
    dy: 30 + i * 3,
    peak: c.peak,
    spin: c.spin,
    s: c.s,
  }));
const throwIn = (at: number, i: number): Clump[] =>
  [
    { dx: -60, peak: -20, spin: 240, s: 0.95, y: 0 },
    { dx: -72, peak: -28, spin: -200, s: 0.65, y: -5 },
    { dx: -50, peak: -14, spin: 160, s: 0.5, y: 4 },
  ].map((c, k) => ({
    at: at + k * 0.55,
    x: 233 - i * 2,
    y: 94 + c.y,
    dx: c.dx,
    dy: 50 - i * 5,
    peak: c.peak,
    spin: c.spin,
    s: c.s,
  }));

const CLUMPS: Clump[] = [
  ...throwOut(11.5, 0), ...throwOut(22.5, 1), ...throwOut(33.5, 2),
  ...throwIn(58.5, 0), ...throwIn(67.5, 1), ...throwIn(76.5, 2),
];

export function Ceremony({ feature, hours, spend, id, slug, people, onDone }: Props) {
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
    /* The stone settles at 93% of the run. The certificate must not exist
       before then — showing it while he is still digging gives the ending
       away and turns the burial into a loading screen. */
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
    }, RUN - 150);
    return () => clearTimeout(t);
  }, [hours, onDone]);

  return (
    <div ref={box} className="flex flex-col gap-4">
      <div className="ceremony relative overflow-hidden rounded-xl bg-[#0b0d10]">
        <svg viewBox="0 34 400 142" className="block w-full" aria-label="A grave is dug for the feature">
          <defs>
            <linearGradient id="cySky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#161d27" />
              <stop offset="0.6" stopColor="#0f141b" />
              <stop offset="1" stopColor="#0b0e12" />
            </linearGradient>
            <radialGradient id="cyMoon" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#e8e4d8" stopOpacity="0.5" />
              <stop offset="0.45" stopColor="#e8e4d8" stopOpacity="0.16" />
              <stop offset="1" stopColor="#e8e4d8" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="cyGround" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0d0e0a" />
              <stop offset="1" stopColor="#050603" />
            </linearGradient>
            <linearGradient id="cyStoneFace" x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0" stopColor="#454c56" />
              <stop offset="1" stopColor="#2b3038" />
            </linearGradient>
          </defs>

          <rect width="400" height="176" fill="url(#cySky)" />

          {/* Sky. The moon gives the scene one light source, so the far rim of
              the hole and the top of the stone can catch it and everything
              else can fall away. */}
          <circle cx="338" cy="62" r="34" fill="url(#cyMoon)" opacity="0.5" />
          <circle cx="338" cy="62" r="7.5" fill="#dcd9cd" opacity="0.62" />
          <circle cx="335" cy="59.5" r="1.4" fill="#c2bfb2" opacity="0.4" />
          <circle cx="341" cy="65" r="1.9" fill="#c2bfb2" opacity="0.32" />
          {[[42, 58], [88, 47], [130, 72], [186, 54], [240, 65], [286, 50], [64, 84], [156, 94], [372, 90]].map(
            ([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.1 : 0.75} fill="#cfd6e0" opacity={0.35 + (i % 4) * 0.1} />
            ),
          )}

          {/* The rest of the yard, far off and unlit. Same silhouettes as the
              horizon on the home page, so this reads as the same place. */}
          <g fill="#10161e">
            <path d="M0 130 h400 v24 H0 Z" />
            <path d="M18 130 v-15 a6.5 6.5 0 0 1 13 0 v15 Z" />
            <path d="M48 130 v-10 h9.5 v10 Z" />
            <path d="M74 130 v-18 h3 v6.5 h6.5 v3 h-6.5 v8.5 Z" />
            <path d="M104 130 v-12 a6 6 0 0 1 12 0 v12 Z" />
            <path d="M356 130 v-13 a5.5 5.5 0 0 1 11 0 v13 Z" />
            <path d="M380 130 v-9 h8.5 v9 Z" />
            <path d="M148 130 v-28 m0 -6 v6 m0 -6 l-10 -9 m10 9 l9 -11 m-9 5 l-7 -5 m7 -1 l8 -7"
                  stroke="#10161e" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          </g>
          <g className="cy-mist">
            <ellipse cx="120" cy="136" rx="130" ry="7" fill="#7d8ea0" opacity="0.06" />
            <ellipse cx="300" cy="139" rx="110" ry="5" fill="#7d8ea0" opacity="0.05" />
          </g>

          <g className="cy-cam">
            {/* Ground. The grass line is the only sharp edge at this depth, so
                the moment the hole breaks it the eye goes straight there. */}
            <rect x="-20" y="152" width="440" height="46" fill="url(#cyGround)" />
            <rect x="-20" y="151.2" width="440" height="1.4" fill="#2a3320" />

            {/* The grave. Three stacked shapes: the lit far rim, the shaft,
                and the floor. Scaled open in three steps by the strokes. */}
            <g transform="translate(170,152)">
              <g className="cy-pit">
                <ellipse cx="0" cy="-1" rx="37" ry="11" fill="#54452f" />
                <ellipse cx="0" cy="0" rx="36" ry="10.6" fill="#2a2116" />
                <ellipse cx="0" cy="2.6" rx="31" ry="8.4" fill="#140e08" />
                <ellipse cx="0" cy="5" rx="23" ry="5.4" fill="#040303" />
                {/* far wall, the only thing down there the moon reaches */}
                <path d="M-36 0 A36 10.6 0 0 1 36 0" fill="none" stroke="#816a4b" strokeWidth="1.8" opacity="0.9" />
              </g>
            </g>

            {/* What is being buried: a small window with its light still on.
                It goes down, and the light goes out at the bottom. */}
            <g transform="translate(170,0)"><g className="cy-card">
              <ellipse className="cy-glow" cx="0" cy="118" rx="30" ry="20" fill="#9fd0c4" opacity="0.07" />
              <rect x="-23" y="102" width="46" height="32" rx="3.5" fill="#1c222b" stroke="#3d4854" strokeWidth="1.1" />
              <rect x="-23" y="102" width="46" height="7.5" rx="3.5" fill="#262e39" />
              <circle cx="-18.5" cy="105.6" r="1.2" fill="#525d6b" />
              <circle cx="-14.5" cy="105.6" r="1.2" fill="#525d6b" />
              <rect x="-18" y="114" width="26" height="2.8" rx="1.4" fill="#c9d0d9" />
              <rect x="-18" y="120.5" width="34" height="2.2" rx="1.1" fill="#6c7581" />
              <rect x="-18" y="125.5" width="19" height="2.2" rx="1.1" fill="#6c7581" />
            </g></g>

            {/* The heap he throws it onto, then takes it back from. */}
            <g transform="translate(296,152)">
              <g className="cy-heap">
                <path d="M-46 0 Q-28 -26 -6 -29 Q18 -32 33 -14 Q41 -6 48 0 Z" fill="#2b2519" />
                <path d="M-33 0 Q-20 -17 -2 -20 Q13 -22 24 -9 Q30 -4 34 0 Z" fill="#362e21" />
                <path d="M-8 -20 q5 -3 10 -1" stroke="#4a3e2d" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              </g>
            </g>

            {/* The mound left behind once the earth is back. */}
            <g transform="translate(170,152)">
              <g className="cy-mound">
                <path d="M-58 0 Q-30 -22 0 -23 Q30 -24 58 0 Z" fill="#2e2719" />
                <path d="M-40 0 Q-18 -15 2 -16 Q22 -16 40 0 Z" fill="#392f22" />
              </g>
            </g>

            {/* The gravedigger. Placement lives on the wrappers, motion on the
                classes — an element cannot carry both a transform attribute
                and a CSS transform, the CSS one silently wins. */}
            <g transform="translate(228,152)">
              <g className="cy-turn">
                <g className="cy-digger">
                  <ellipse cx="0" cy="1.5" rx="17" ry="3.6" fill="#04060a" opacity="0.6" />
                  <g transform="translate(0,-24)">
                    <g className="cy-legb"><path d="M0 0 v24" stroke="#0f131a" strokeWidth="6" strokeLinecap="round" /></g>
                    <g className="cy-legf"><path d="M0 0 v24" stroke="#161c25" strokeWidth="6" strokeLinecap="round" /></g>
                  </g>
                  <g transform="translate(0,-25)">
                    <g className="cy-torso">
                      {/* A long coat. At this size the silhouette is the whole
                          character, and a coat gives it one clean outline. */}
                      <path d="M-11.4 4.5 Q-12 -14 -6.5 -23 L6.5 -23 Q12 -14 11.4 4.5 Z" fill="#161c24" />
                      <path d="M-11.4 4.5 Q-4.5 7 0 7 Q4.5 7 11.4 4.5 L11.4 6 Q0 9 -11.4 6 Z" fill="#0e1218" />
                      <path d="M-1.2 -20 L-1.2 4" stroke="#0d1116" strokeWidth="1.4" />
                      {/* the hood, and the dark where a face would be */}
                      <path d="M-8.6 -20.4 a8.6 8.6 0 0 1 17.2 0 q0 5.8 -2.1 8.9 h-13 q-2.1 -3.1 -2.1 -8.9 Z" fill="#1f2632" />
                      <circle cx="2.6" cy="-20.1" r="5.7" fill="#080b0f" />
                      <path d="M-8.6 -20.4 a8.6 8.6 0 0 1 5.3 -7.95 l1.15 2.55 a5.9 5.9 0 0 0 -3.65 5.4 Z" fill="#3a4859" />
                      <g transform="translate(1.5,-16)">
                        <g className="cy-arm">
                          <path d="M0 0 L19 17" stroke="#1b222c" strokeWidth="5.4" strokeLinecap="round" />
                          <circle cx="19" cy="17" r="3" fill="#222b36" />
                          <g transform="translate(19,17)">
                            <g className="cy-spade">
                              <path d="M-15 -13 L11 9.5" stroke="#7d6a4b" strokeWidth="2.8" strokeLinecap="round" />
                              <path d="M-15 -13 l-3.4 -3" stroke="#6b5b40" strokeWidth="4.6" strokeLinecap="round" />
                              <path d="M9.6 8.2 l6.2 5.4 a6.2 6.2 0 0 1 -8.9 7 l-4.4 -7 Z" fill="#78828c" />
                              <path d="M9.6 8.2 l6.2 5.4 a6.2 6.2 0 0 1 -5.4 7.2 Z" fill="#5b646d" />
                            </g>
                          </g>
                        </g>
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            </g>

            {/* Earth in the air. Drawn after the digger so it passes in front
                of him on the way over his shoulder. */}
            {CLUMPS.map((c, i) => (
              <g key={i} transform={`translate(${c.x},${c.y})`}>
                <g
                  className="cy-fly"
                  style={{
                    animationDelay: `${((c.at / 100) * RUN).toFixed(0)}ms`,
                    ["--dx" as string]: `${c.dx}px`,
                  }}
                >
                  <g
                    className="cy-fly-y"
                    style={{
                      animationDelay: `${((c.at / 100) * RUN).toFixed(0)}ms`,
                      ["--dy" as string]: `${c.dy}px`,
                      ["--peak" as string]: `${c.peak}px`,
                      ["--spin" as string]: `${c.spin}deg`,
                    }}
                  >
                    <path
                      d="M-3 -1 l2.4 -2.2 l3 0.6 l1.6 2.4 l-1.4 2.4 l-3.2 0.4 Z"
                      fill="#4e4230"
                      transform={`scale(${c.s})`}
                    />
                  </g>
                </g>
              </g>
            ))}

            {/* What leaves when the light goes out. The same ghost as the one
                in the yard game, so the two read as one world. */}
            <g transform="translate(170,152)"><g className="cy-ghost">
              <path d="M-9 4 V-5 a9 9 0 0 1 18 0 V4 l-3.6 -3 l-3.6 3 l-3.6 -3 Z" fill="#b9d6cd" opacity="0.5" />
              <circle cx="-3.2" cy="-4" r="1.5" fill="#0d1114" opacity="0.55" />
              <circle cx="3.2" cy="-4" r="1.5" fill="#0d1114" opacity="0.55" />
            </g></g>

            {/* The stone, rising through the mound. */}
            <g transform="translate(170,152)">
              <g className="cy-stone">
                <path d="M-40 0 V-38 A52 52 0 0 1 40 -38 V0 Z" fill="#1e232a" />
                <path d="M-37 -1 V-38 A49 49 0 0 1 37 -38 V-1 Z" fill="url(#cyStoneFace)" />
                <path d="M-37 -1 V-38 A49 49 0 0 1 -22 -54 L-19 -50.5 A45 45 0 0 0 -33 -37 V-1 Z" fill="#616a77" opacity="0.45" />
                <path d="M-30 -5 V-37 A42 42 0 0 1 30 -37 V-5 Z" fill="#1b1f26" opacity="0.5" />
                <text y="-47" textAnchor="middle" fontFamily="serif" fontSize="6" letterSpacing="2.6" fill="#98a1ad">
                  HERE LIES
                </text>
                {/* The block is centred on the panel rather than stacked down
                    from a fixed line, so a one-word name and a three-line one
                    both sit where a mason would have put them. */}
                {ins.lines.map((l, i) => (
                  <text
                    key={i}
                    y={-30 - ((ins.lines.length - 1) / 2) * (ins.size + 3) + i * (ins.size + 3) + ins.size * 0.35}
                    textAnchor="middle"
                    fontSize={ins.size}
                    fontWeight="600"
                    fill="#efedea"
                  >
                    {l}
                  </text>
                ))}
                <text y="-6.5" textAnchor="middle" fontSize="5.4" letterSpacing="1.5" fill="#727a85">
                  {registry(id)}
                </text>
              </g>
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
