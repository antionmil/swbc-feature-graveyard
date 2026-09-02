/**
 * The title climbs out of the ground, a letter at a time.
 *
 * Server-rendered, not JavaScript — the letters are in the HTML and the
 * animation is CSS, so the heading is readable to a crawler, to a reader with
 * scripting off, and to anyone who arrives before hydration.
 */
export function DigTitle({ text, className = "" }: { text: string; className?: string }) {
  const letters = [...text];
  return (
    <h1 className={className}>
      {/* The real text, for anything that does not paint: screen readers get
          one clean string instead of nineteen separate letters. */}
      <span className="sr-only">{text}</span>
      <span aria-hidden className="dig-title">
        {letters.map((c, i) => (
          <span key={i} style={{ animationDelay: `${0.25 + i * 0.045}s` }}>
            {c === " " ? " " : c}
          </span>
        ))}
      </span>
    </h1>
  );
}
