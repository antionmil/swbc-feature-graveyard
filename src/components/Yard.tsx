/**
 * The horizon.
 *
 * Silhouetted stones at the foot of the page, with fog drifting across them.
 * It is decoration and it says so — `aria-hidden`, no text, and it sits behind
 * everything. The point is that a visitor knows what kind of place this is
 * before reading a word, without the layout becoming a game.
 */
const STONES = [
  { x: 18, w: 26, h: 34, o: 0.5 },
  { x: 62, w: 20, h: 26, o: 0.38 },
  { x: 104, w: 32, h: 44, o: 0.62 },
  { x: 158, w: 18, h: 24, o: 0.32 },
  { x: 196, w: 28, h: 38, o: 0.55 },
  { x: 246, w: 22, h: 30, o: 0.42 },
  { x: 286, w: 34, h: 48, o: 0.7 },
  { x: 342, w: 20, h: 26, o: 0.35 },
  { x: 380, w: 26, h: 36, o: 0.5 },
  { x: 428, w: 18, h: 22, o: 0.3 },
  { x: 462, w: 30, h: 40, o: 0.58 },
];

export function Yard({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none select-none ${className}`}>
      <svg viewBox="0 0 500 70" className="block w-full" preserveAspectRatio="xMidYMax slice">
        <g className="yard-drift">
          {STONES.map((s, i) => (
            <path
              key={i}
              d={`M${s.x} 70 V${70 - s.h + s.w / 2} A${s.w / 2} ${s.w / 2} 0 0 1 ${s.x + s.w} ${70 - s.h + s.w / 2} V70 Z`}
              fill="#1c2026"
              opacity={s.o}
            />
          ))}
        </g>
        <rect y="66" width="500" height="4" fill="#171a1f" />
        <g className="yard-fog">
          <ellipse cx="120" cy="62" rx="150" ry="10" fill="#2a3038" opacity=".28" />
          <ellipse cx="380" cy="66" rx="180" ry="9" fill="#2a3038" opacity=".22" />
        </g>
      </svg>
    </div>
  );
}
