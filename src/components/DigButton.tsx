"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

/**
 * The button digs itself in.
 *
 * The dirt is a canvas particle system, not CSS keyframes — thirty-odd clods
 * with their own size, spin, arc and drag, thrown from the point the spade
 * enters. Keyframes can move a fixed number of divs along fixed paths; they
 * cannot give every clod a different mass. That difference is the whole gap
 * between this looking thrown and looking animated.
 *
 * The button also sinks, and a shadow opens beneath it, so the spray reads as
 * displaced earth rather than confetti.
 */
type Clod = {
  x: number; y: number; vx: number; vy: number;
  r: number; spin: number; rot: number; life: number; tone: number;
};

const DIRT = ["#6b5a41", "#7d6a4e", "#5a4b36", "#8a7a63"];

export function DigButton({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  const [digging, setDigging] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLAnchorElement>(null);

  const spray = useCallback(() => {
    const cv = canvas.current;
    const el = box.current;
    if (!cv || !el) return;
    const r = el.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = r.width * dpr;
    cv.height = (r.height + 70) * dpr;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Thrown from where the spade bites, not from the middle of the button.
    const ox = 30;
    const oy = r.height + 46;
    const clods: Clod[] = Array.from({ length: 34 }, () => {
      const a = -Math.PI / 2 + (Math.random() - 0.45) * 1.5;
      const sp = 2.2 + Math.random() * 5.2;
      return {
        x: ox + (Math.random() - 0.5) * 16,
        y: oy,
        vx: Math.cos(a) * sp * 1.5,
        vy: Math.sin(a) * sp,
        r: 1.4 + Math.random() * 3.4,
        spin: (Math.random() - 0.5) * 0.4,
        rot: Math.random() * 6.28,
        life: 1,
        tone: Math.floor(Math.random() * DIRT.length),
      };
    });

    let raf = 0;
    const step = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      let alive = false;
      for (const c of clods) {
        c.vy += 0.34;          // gravity
        c.vx *= 0.985;         // drag
        c.x += c.vx;
        c.y += c.vy;
        c.rot += c.spin;
        c.life -= 0.016;
        if (c.life <= 0 || c.y > oy + 26) continue;
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, c.life * 1.4));
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle = DIRT[c.tone];
        // Irregular quads, not circles — circles read as bubbles.
        ctx.fillRect(-c.r, -c.r * 0.8, c.r * 2, c.r * 1.6);
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(step);
      else ctx.clearRect(0, 0, cv.width, cv.height);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  function go(e: React.MouseEvent) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (digging) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setDigging(true);
    router.prefetch(href);
    if (!reduce) spray();
    setTimeout(() => router.push(href), reduce ? 0 : 760);
  }

  return (
    <span className="relative inline-block self-start">
      <a
        ref={box}
        href={href}
        onClick={go}
        className={`dig-btn relative z-10 inline-flex items-center gap-2.5 rounded-full bg-accent px-7 py-3.5 text-sm font-medium tracking-[0.04em] text-ground ${
          digging ? "digging" : ""
        }`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transformOrigin: "12px 3px" }}>
          <path d="M12 3v11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M8 14h8v3a4 4 0 0 1-8 0z" fill="currentColor" />
          <path d="M9.5 3h5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        {children}
      </a>
      {/* The hole the button drops into. */}
      <span aria-hidden className={`dig-hole ${digging ? "open" : ""}`} />
      <canvas ref={canvas} aria-hidden className="pointer-events-none absolute -bottom-[70px] left-0 z-20 w-full" style={{ height: "calc(100% + 70px)" }} />
    </span>
  );
}
