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

/** A shambling silhouette. Two legs and an arm on separate slow cycles, so the
 *  gait is uneven — a walk with matching limbs reads as a machine. */
function Zombie({ delay, dur, scale, y }: { delay: number; dur: number; scale: number; y: number }) {
  return (
    <g
      className="yard-walk"
      style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
      opacity={0.45}
    >
      <g transform={`translate(0 ${y}) scale(${scale})`}>
        <g className="yard-bob">
          <ellipse cx="0" cy="-19" rx="2.6" ry="3" className="yard-figure" />
          <path d="M-2.4 -16 h4.8 v9 h-4.8 Z" className="yard-figure" />
          {/* arms out in front, the only bit of the pose that says zombie */}
          <path d="M2 -14 l6 1.6" className="yard-figure-s" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M-2 -14 l5.4 2.6" className="yard-figure-s" strokeWidth="1.5" strokeLinecap="round" />
        </g>
        <path className="yard-leg-a" d="M-1 -7 v7" className="yard-figure-s" strokeWidth="1.8" strokeLinecap="round" />
        <path className="yard-leg-b" d="M1 -7 v7" className="yard-figure-s" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </g>
  );
}

export function Yard({ className = "", zombies = false }: { className?: string; zombies?: boolean }) {
  return (
    <div aria-hidden className={`pointer-events-none select-none ${className}`}>
      <svg viewBox="0 0 500 70" className="block w-full" preserveAspectRatio="xMidYMax slice">
        <g className="yard-drift">
          {STONES.map((s, i) => (
            <path
              key={i}
              d={`M${s.x} 70 V${70 - s.h + s.w / 2} A${s.w / 2} ${s.w / 2} 0 0 1 ${s.x + s.w} ${70 - s.h + s.w / 2} V70 Z`}
              className="yard-stone"
              opacity={s.o}
            />
          ))}
        </g>
        <rect y="66" width="500" height="4" className="yard-line" />
        {zombies && (
          <g>
            <Zombie delay={0} dur={54} scale={1} y={66} />
            <Zombie delay={-22} dur={68} scale={0.78} y={69} />
            <Zombie delay={-41} dur={61} scale={0.9} y={64} />
          </g>
        )}
        <g className="yard-fog">
          <ellipse cx="120" cy="62" rx="150" ry="10" className="yard-mist" opacity=".28" />
          <ellipse cx="380" cy="66" rx="180" ry="9" className="yard-mist" opacity=".22" />
        </g>
      </svg>
    </div>
  );
}
