"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The graveyard run.
 *
 * Jump the zombies, duck the ghosts, and it gets faster. Everything is drawn
 * on one canvas at a fixed logical size and scaled to the element, so the
 * physics are identical on a phone and a desktop — a game whose difficulty
 * depends on the window width is not a game.
 *
 * The best score lives in localStorage. Nothing is sent anywhere.
 */
const W = 600;
const H = 130;
const GROUND = H - 22;
const KEY = "fg.best";

type Ob = { x: number; kind: "zombie" | "ghost"; w: number; h: number; y: number };

export function YardGame({ onExit }: { onExit: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const [started, setStarted] = useState(false);

  const st = useRef({
    y: 0, vy: 0, ducking: false, obs: [] as Ob[], t: 0, speed: 3.4, next: 60, dead: false, score: 0,
  });

  useEffect(() => {
    try {
      setBest(Number(localStorage.getItem(KEY) || 0));
    } catch {
      /* private mode */
    }
  }, []);

  const reset = useCallback(() => {
    st.current = { y: 0, vy: 0, ducking: false, obs: [], t: 0, speed: 3.4, next: 60, dead: false, score: 0 };
    setScore(0);
    setOver(false);
    setStarted(true);
  }, []);

  const jump = useCallback(() => {
    const s = st.current;
    if (s.dead) return reset();
    if (!s.y) s.vy = -9.4;
  }, [reset]);

  useEffect(() => {
    if (!started) return;
    const c = cv.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue("--color-ink").trim() || "#e8e6e1";
    const ground = css.getPropertyValue("--color-ground").trim() || "#131417";
    const faint = css.getPropertyValue("--color-faint").trim() || "#7a7e85";

    let raf = 0;
    const loop = () => {
      const s = st.current;
      if (!s.dead) {
        s.t++;
        s.speed = 3.4 + s.t / 900;
        s.vy += 0.52;
        s.y = Math.min(0, s.y + s.vy);
        if (s.y === 0) s.vy = 0;

        if (--s.next <= 0) {
          const ghost = Math.random() < 0.38;
          s.obs.push(
            ghost
              ? { x: W + 20, kind: "ghost", w: 15, h: 12, y: GROUND - 30 }
              : { x: W + 20, kind: "zombie", w: 11, h: 20, y: GROUND - 20 },
          );
          s.next = Math.max(34, 82 - s.t / 60) + Math.random() * 40;
        }
        s.obs.forEach((o) => (o.x -= s.speed));
        s.obs = s.obs.filter((o) => o.x > -40);
        s.score = Math.floor(s.t / 6);

        // The player box shrinks when ducking, which is what makes ducking work.
        const px = 60, pw = 12;
        const ph = s.ducking && s.y === 0 ? 11 : 20;
        const py = GROUND - ph + s.y;
        for (const o of s.obs) {
          if (px < o.x + o.w && px + pw > o.x && py < o.y + o.h && py + ph > o.y) {
            s.dead = true;
            setOver(true);
            setScore(s.score);
            setBest((b) => {
              const nb = Math.max(b, s.score);
              try { localStorage.setItem(KEY, String(nb)); } catch { /* ignore */ }
              return nb;
            });
          }
        }
        if (s.t % 6 === 0) setScore(s.score);
      }

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = ground;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = faint;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(0, GROUND + 1, W, 1.5);
      ctx.globalAlpha = 1;

      // player — a gravedigger with a spade over the shoulder
      const s2 = st.current;
      const ph = s2.ducking && s2.y === 0 ? 11 : 20;
      ctx.fillStyle = ink;
      ctx.fillRect(60, GROUND - ph + s2.y, 12, ph);
      if (!s2.ducking || s2.y !== 0) {
        ctx.fillRect(72, GROUND - ph + s2.y + 2, 7, 2);
      }

      for (const o of s2.obs) {
        if (o.kind === "zombie") {
          ctx.fillStyle = "#5f8f5a";
          ctx.fillRect(o.x, o.y, o.w, o.h);
          ctx.fillRect(o.x + o.w, o.y + 4, 5, 2); // arms out
        } else {
          ctx.fillStyle = ink;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.arc(o.x + o.w / 2, o.y + 6, o.w / 2, Math.PI, 0);
          ctx.fillRect(o.x, o.y + 6, o.w, o.h - 6);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump(); }
      if (e.code === "ArrowDown") { e.preventDefault(); st.current.ducking = true; }
      if (e.code === "Escape") onExit();
    };
    const up = (e: KeyboardEvent) => { if (e.code === "ArrowDown") st.current.ducking = false; };
    addEventListener("keydown", down);
    addEventListener("keyup", up);
    return () => { removeEventListener("keydown", down); removeEventListener("keyup", up); };
  }, [jump, onExit]);

  return (
    <div className="select-none">
      <div className="flex items-center justify-between gap-3 pb-2 text-xs text-muted">
        <span className="tabular-nums">
          {score} <span className="text-faint">· best {best}</span>
        </span>
        <span className="hidden sm:inline text-faint">space to jump · down to duck · esc to leave</span>
        <button onClick={onExit} className="text-muted underline underline-offset-4 hover:text-accent">
          leave
        </button>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-rule">
        <canvas
          ref={cv}
          width={W}
          height={H}
          onPointerDown={(e) => {
            e.preventDefault();
            // Bottom third of the canvas ducks, the rest jumps — a phone has no
            // arrow keys and a jump-only runner cannot dodge the ghosts.
            const r = e.currentTarget.getBoundingClientRect();
            if (e.clientY - r.top > r.height * 0.66) {
              st.current.ducking = true;
              setTimeout(() => (st.current.ducking = false), 420);
            } else jump();
          }}
          className="block w-full touch-none"
          style={{ imageRendering: "pixelated" }}
        />
        {(!started || over) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ground/80">
            <p className="text-sm text-ink">
              {over ? `Caught at ${score}` : "The graveyard run"}
            </p>
            <button
              onClick={reset}
              className="rounded-full border border-edge px-4 py-1.5 text-xs text-muted hover:border-accent hover:text-accent"
            >
              {over ? "again" : "start"}
            </button>
            <p className="text-[11px] text-faint">tap to jump · tap low to duck</p>
          </div>
        )}
      </div>
    </div>
  );
}
