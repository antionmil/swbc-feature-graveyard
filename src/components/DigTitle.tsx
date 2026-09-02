/**
 * The title is pushed up out of the ground, one letter at a time.
 *
 * Each letter sits in its OWN clipped box, so it rises from behind a line
 * rather than sliding in from off-screen — that difference is the whole
 * effect. Delays are deliberately uneven: a constant interval reads as one
 * object moving, letters slightly out of step read as separate things being
 * forced up.
 *
 * Server-rendered, so the heading is in the HTML for a crawler and for anyone
 * who arrives before hydration. The screen reader gets one clean string
 * instead of seventeen separate letters.
 */
const JITTER = [0, 0.075, 0.02, 0.115, 0.045, 0.09, 0.015, 0.13, 0.06];

export function DigTitle({ text, className = "" }: { text: string; className?: string }) {
  return (
    <h1 className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="dig-title">
        {[...text].map((c, i) =>
          c === " " ? (
            <span key={i} className="dig-space" />
          ) : (
            <span key={i} className="dig-letter">
              <span style={{ animationDelay: `${0.28 + i * 0.05 + JITTER[i % JITTER.length]}s` }}>
                {c}
              </span>
            </span>
          ),
        )}
      </span>
    </h1>
  );
}
