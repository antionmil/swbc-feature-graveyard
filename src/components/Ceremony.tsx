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
  /** Carved under the name when it is there. The stone has to hold it. */
  author?: string | null;
  hours: number;
  spend: number | null;
  id: number;
  slug: string;
  people: number;
  onDone?: () => void;
};

const RUN = 9000;

/**
 * Lay the inscription out on the stone.
 *
 * The stone has to hold four things and they compete: HERE LIES, the feature
 * name over as many as four lines, who buried it — a nickname somebody typed,
 * of unknown length — and the registry number. The previous version fitted the
 * name to a width and stacked everything down from a fixed line, which fails
 * the moment a name is long AND an author is present.
 *
 * So nothing here is a fixed offset. The name is wrapped and sized until the
 * whole block fits the space actually left over, and the block is then centred
 * in that space, which is what "aligned" means on a headstone. If nothing fits
 * even at the smallest legible size, the name is truncated rather than allowed
 * to run off the edge.
 *
 * Coordinates are stone-local: y = 0 is the base, negative is up.
 */
const PANEL = {
  header: -55.6,    // HERE LIES baseline, low enough that even its ascent
                    // box clears the panel arc, not just its ink
  headerSize: 5.2,  // narrow enough to sit inside the panel where it curves in
  headerTrack: 2.2,
  nameTop: -47.6,   // highest baseline the name may take
  registry: -8.6,   // registry baseline, always at the foot
  byline: -17.6,    // "buried by" baseline when there is one
  width: 70,        // usable width, in the straight-sided part of the stone
  bylineWidth: 68,
};
const ADVANCE = 0.56;   // average glyph advance, in em, measured wide on purpose
const SERIF = 0.52;     // the inscription face runs a little narrower
const LEADING = 1.42;  // a serif at this size needs more air than a sans;
                       // at 1.3 the descenders crowded the line below

function wrap(text: string, budget: number) {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(/\s+/).filter(Boolean)) {
    if (line && (line + " " + w).length > budget) { out.push(line); line = ""; }
    line = line ? line + " " + w : w.length > budget ? w.slice(0, budget - 1) + "\u2026" : w;
  }
  if (line) out.push(line);
  return out;
}

/** One line of the inscription. Drawn exactly once. */
function Carved({
  y, size, fill = "#1b2026", track, weight, children,
}: {
  y: number; size: number; fill?: string; track?: number; weight?: number; children: string;
}) {
  return (
    <text
      textAnchor="middle"
      fontFamily="Georgia, 'Times New Roman', serif"
      fontSize={size}
      fontWeight={weight}
      letterSpacing={track}
      y={y}
      fill={fill}
    >
      {children}
    </text>
  );
}

function inscription(feature: string, author?: string | null) {
  const by = (author ?? "").trim().replace(/^@+/, "").slice(0, 22);
  const hasBy = by.length > 0;

  /* The floor the name may not cross: the byline's cap height when there is a
     byline, the registry's when there is not. */
  const floor = hasBy ? -26.4 : -18.6;
  const span = floor - PANEL.nameTop;      // 21.2 with a byline, 29 without

  let size = 5;
  let lines = wrap(feature, 12);
  for (let s = 9.5; s >= 5; s -= 0.25) {
    const budget = Math.max(6, Math.floor(PANEL.width / (s * ADVANCE)));
    const cand = wrap(feature, budget);
    if (cand.length > 4) continue;
    if ((cand.length - 1) * LEADING * s > span) continue;
    size = s;
    lines = cand;
    break;
  }
  /* Nothing fitted whole: keep the smallest legible size and cut instead. */
  if ((lines.length - 1) * LEADING * size > span || lines.length > 4) {
    const nMax = Math.max(1, Math.min(4, Math.floor(span / (LEADING * 5)) + 1));
    lines = wrap(feature, Math.max(6, Math.floor(PANEL.width / (5 * ADVANCE))));
    if (lines.length > nMax) {
      lines = lines.slice(0, nMax);
      lines[nMax - 1] = lines[nMax - 1].replace(/.{1}$/, "\u2026");
    }
    size = 5;
  }

  const blockH = (lines.length - 1) * LEADING * size;
  const first = PANEL.nameTop + (span - blockH) / 2;

  /* The byline is whatever somebody typed, so it is the line that decides its
     own size rather than the other way round. At the floor of 3.8 a 22
     character nickname still sits inside the panel. */
  const byText = hasBy ? `buried by ${by}` : null;
  const bySize = byText
    ? Math.max(3.8, Math.min(5.2, PANEL.bylineWidth / (byText.length * SERIF)))
    : 0;

  return {
    size,
    lines: lines.map((text, i) => ({ text, y: first + i * LEADING * size })),
    by: byText,
    bySize: Number(bySize.toFixed(2)),
  };
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
    x: 234 + i * 2,
    y: 94 + c.y,
    dx: c.dx,
    dy: 30 + i * 3,
    peak: c.peak,
    spin: c.spin,
    s: c.s,
  }));
const throwIn = (at: number, i: number): Clump[] =>
  [
    { dx: -72, peak: -20, spin: 240, s: 0.95, y: 0 },
    { dx: -84, peak: -28, spin: -200, s: 0.65, y: -5 },
    { dx: -62, peak: -14, spin: 160, s: 0.5, y: 4 },
  ].map((c, k) => ({
    at: at + k * 0.55,
    x: 242 - i * 2,
    y: 94 + c.y,
    dx: c.dx,
    dy: 38 - i * 4,
    peak: c.peak,
    spin: c.spin,
    s: c.s,
  }));

const CLUMPS: Clump[] = [
  ...throwOut(11.5, 0), ...throwOut(22.5, 1), ...throwOut(33.5, 2),
  ...throwIn(58.5, 0), ...throwIn(67.5, 1), ...throwIn(76.5, 2),
];

export function Ceremony({ feature, author, hours, spend, id, slug, people, onDone }: Props) {
  const [phase, setPhase] = useState<"run" | "done">("run");
  const [shown, setShown] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const ins = inscription(feature, author);
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
        <svg
          viewBox="0 34 400 142"
          className="block w-full"
          role="img"
          aria-label="A grave is dug for the feature"
        >
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
            {/* The incision.
                Three offset copies of the glyphs was the wrong technique: at
                this size the offset needed to be visible was large enough to
                read as a second copy of the text rather than as a bevel, which
                is exactly what it looked like. This does it with one set of
                glyphs and two blurred edges instead — the moon is up and to the
                right, so the groove wall facing up-right is dark and the wall
                facing down-left catches the light. Blurred, so it reads as
                depth and never as a ghost. */}
            {/* No text filter and no offset copies. Depth comes from the PANEL,
                which is a large shape where a one-unit bevel is proportionally
                tiny and reads correctly — and the letters read as cut because
                they are dark inside pale, moonlit granite, which is what an
                inscription actually looks like at any distance. Faking relief
                on the glyphs themselves only ever produced a doubled image. */}
            <linearGradient id="cyStoneFace" x1="0" y1="0" x2="0.35" y2="1">
              <stop offset="0" stopColor="#9ea7b1" />
              <stop offset="1" stopColor="#79828e" />
            </linearGradient>
            <linearGradient id="cyPanelFace" x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0" stopColor="#8b949e" />
              <stop offset="1" stopColor="#79828d" />
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
                <ellipse cx="0" cy="-1" rx="40" ry="11.8" fill="#54452f" />
                <ellipse cx="0" cy="0" rx="39" ry="11.4" fill="#2a2116" />
                <ellipse cx="0" cy="2.8" rx="34" ry="9.2" fill="#140e08" />
                <ellipse cx="0" cy="5.4" rx="25" ry="5.8" fill="#040303" />
                {/* far wall, the only thing down there the moon reaches */}
                <path d="M-39 0 A39 11.4 0 0 1 39 0" fill="none" stroke="#816a4b" strokeWidth="1.8" opacity="0.9" />
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
                <path d="M-56 0 Q-30 -24 0 -25 Q30 -26 56 0 Z" fill="#2e2719" />
                <path d="M-42 0 Q-19 -17 2 -18 Q23 -18 42 0 Z" fill="#392f22" />
              </g>
            </g>

            {/* The gravedigger. Placement lives on the wrappers, motion on the
                classes — an element cannot carry both a transform attribute
                and a CSS transform, the CSS one silently wins. */}
            <g transform="translate(238,152)">
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
                              {/* Drawn along its own axis and then turned onto
                                  the arm's line — an angled spade built out of
                                  free-hand diagonals is how the old one ended
                                  up reading as a mallet. Same overall reach as
                                  before, so the solved joint angles still hold:
                                  the blade centre sits 19.5 units from the
                                  hand either way. */}
                              <g transform="rotate(41)">
                                {/* T-grip */}
                                <path d="M-17.5 -4.4 v8.8" stroke="#6f5e42" strokeWidth="2.8" strokeLinecap="round" />
                                <path d="M-17.5 0 h3.5" stroke="#6f5e42" strokeWidth="3.2" strokeLinecap="round" />
                                {/* shaft, with the grain shaded on the underside */}
                                <path d="M-15 0 H10.6" stroke="#8b7757" strokeWidth="2.9" strokeLinecap="round" />
                                <path d="M-14.6 1.05 H10.4" stroke="#655537" strokeWidth="0.9" strokeLinecap="round" />
                                {/* socket, where the shaft goes into the steel */}
                                <path d="M9.4 -1.6 L13.4 -4 L13.4 4 L9.4 1.6 Z" fill="#4b535b" />
                                {/* blade: shoulders for a boot, sides, a shallow point */}
                                <path d="M12.8 -5 L20.5 -5.3 Q25.8 -5 27.4 -2.5 Q28.2 -1.2 28.2 0 Q28.2 1.2 27.4 2.5 Q25.8 5 20.5 5.3 L12.8 5 Z"
                                      fill="#67717c" />
                                <path d="M12.8 0 L12.8 5 L20.5 5.3 Q25.8 5 27.4 2.5 Q28.2 1.2 28.2 0 Z" fill="#485159" />
                                <path d="M13.4 0 H26.6" stroke="#858e99" strokeWidth="0.45" opacity="0.35" />
                                {/* the step a boot presses on, at the blade's shoulder */}
                                <path d="M12.6 -5 h2.6 v-1.7 h-2.6 Z" fill="#5a636d" />
                              </g>
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
                {/* the edge of the slab, so it has thickness */}
                <path d="M-48 0 V-56 A90 90 0 0 1 48 -56 V0 Z" fill="#3f4750" />
                <path d="M-45 -1 V-56 A87 87 0 0 1 45 -56 V-1 Z" fill="url(#cyStoneFace)" />
                {/* the moon is up and to the right, so the left edge falls away */}
                <path d="M-45 -1 V-56 A87 87 0 0 1 -26 -66.5 L-23 -63.4 A83 83 0 0 0 -40 -55 V-1 Z"
                      fill="#5f6874" opacity="0.55" />
                <path d="M-45 -1 h90 v1.8 h-90 Z" fill="#2b323a" opacity="0.85" />

                {/* The polished panel, cut into the face. Its bevel is where the
                    depth comes from: a lit lower-left lip, a shaded upper-right
                    wall, on a shape big enough for one unit to read as an edge. */}
                <path d="M-39 -3 V-54 A77 77 0 0 1 39 -54 V-3 Z" fill="#5c646e" />
                <path d="M-38 -4 V-54 A76 76 0 0 1 38 -54 V-4 Z" fill="url(#cyPanelFace)" />
                <path d="M-38 -4 V-54 A76 76 0 0 1 -20 -63.2 L-19 -61.6 A74.5 74.5 0 0 0 -36.6 -53.4 V-4 Z"
                      fill="#aab3bd" opacity="0.55" />
                <path d="M38 -4 V-54 A76 76 0 0 0 20 -63.2 L19 -61.6 A74.5 74.5 0 0 1 36.6 -53.4 V-4 Z"
                      fill="#3d444d" opacity="0.5" />

                <Carved y={PANEL.header} size={PANEL.headerSize} track={PANEL.headerTrack} fill="#333a43">
                  HERE LIES
                </Carved>
                {ins.lines.map((l) => (
                  <Carved key={l.y} y={l.y} size={ins.size} weight={600} fill="#1b2026">
                    {l.text}
                  </Carved>
                ))}
                {ins.by ? (
                  <Carved y={PANEL.byline} size={ins.bySize} fill="#333a43">{ins.by}</Carved>
                ) : null}
                <Carved y={PANEL.registry} size={5} track={1.6} fill="#3a424b">{registry(id)}</Carved>
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
