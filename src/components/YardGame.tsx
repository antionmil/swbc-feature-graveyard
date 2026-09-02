"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The graveyard, with something living in it.
 *
 * Not a runner. The yard stays exactly where it is — the same headstones you
 * were looking at a second ago — and a figure drops into it. Zombies come in
 * from both sides and walk at you. Land on top of one and it goes down; let
 * one touch you any other way and you do. Ghosts drift through and ignore
 * everyone, which is the point of ghosts.
 */
const W = 600;
const H = 190;
const FLOOR = H - 24;
const KEY = "fg.best";

type P = { x: number; y: number; vx: number; vy: number; onGround: boolean; face: 1 | -1 };
type Z = { x: number; y: number; vx: number; dying: number };
type G = { x: number; y: number; vx: number; bob: number };

const STONES = [
  { x: 70, w: 26, h: 30 }, { x: 168, w: 20, h: 22 }, { x: 250, w: 30, h: 36 },
  { x: 355, w: 22, h: 26 }, { x: 452, w: 28, h: 32 }, { x: 528, w: 18, h: 20 },
];

export function YardGame({ onExit }: { onExit: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const [started, setStarted] = useState(false);
  const keys = useRef<Record<string, boolean>>({});

  const st = useRef({
    p: { x: W / 2, y: -30, vx: 0, vy: 0, onGround: false, face: 1 } as P,
    zs: [] as Z[], gs: [] as G[], t: 0, next: 70, dead: false, kills: 0,
  });

  useEffect(() => {
    try { setBest(Number(localStorage.getItem(KEY) || 0)); } catch { /* private mode */ }
  }, []);

  const reset = useCallback(() => {
    st.current = {
      p: { x: W / 2, y: -30, vx: 0, vy: 0, onGround: false, face: 1 },
      zs: [], gs: [], t: 0, next: 70, dead: false, kills: 0,
    };
    setScore(0); setOver(false); setStarted(true);
  }, []);

  const jump = useCallback(() => {
    const s = st.current;
    if (s.dead) return reset();
    if (s.p.onGround) { s.p.vy = -8.6; s.p.onGround = false; }
  }, [reset]);

  useEffect(() => {
    if (!started) return;
    const c = cv.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue("--color-ink").trim() || "#e8e6e1";
    const ground = css.getPropertyValue("--color-ground").trim() || "#131417";
    const stone = css.getPropertyValue("--color-rule").trim() || "#26282d";
    const faint = css.getPropertyValue("--color-faint").trim() || "#7a7e85";

    let raf = 0;
    const loop = () => {
      const s = st.current;
      const p = s.p;

      if (!s.dead) {
        s.t++;
        const k = keys.current;
        const left = k.ArrowLeft || k.KeyA, right = k.ArrowRight || k.KeyD;
        p.vx = left ? -3.1 : right ? 3.1 : p.vx * 0.72;
        if (left) p.face = -1; if (right) p.face = 1;
        p.vy += 0.52;
        p.x = Math.max(8, Math.min(W - 20, p.x + p.vx));
        p.y += p.vy;
        if (p.y >= FLOOR - 20) { p.y = FLOOR - 20; p.vy = 0; p.onGround = true; }

        // zombies arrive faster as it goes on, from whichever side is emptier
        if (--s.next <= 0) {
          const fromLeft = Math.random() < 0.5;
          s.zs.push({ x: fromLeft ? -20 : W + 20, y: FLOOR - 18, vx: (fromLeft ? 1 : -1) * (0.8 + s.t / 4200), dying: 0 });
          s.next = Math.max(28, 90 - s.t / 45);
        }
        if (s.t % 260 === 0) s.gs.push({ x: -30, y: 30 + Math.random() * 60, vx: 0.55, bob: Math.random() * 6.28 });

        for (const z of s.zs) {
          if (z.dying) { z.dying--; continue; }
          // they walk at you, not in a straight line
          const dir = p.x > z.x ? 1 : -1;
          z.vx = dir * (0.75 + s.t / 4200);
          z.x += z.vx;
        }
        s.gs.forEach((g) => { g.x += g.vx; g.bob += 0.045; });
        s.gs = s.gs.filter((g) => g.x < W + 40);
        s.zs = s.zs.filter((z) => z.dying !== 1);

        for (const z of s.zs) {
          if (z.dying) continue;
          const hit = p.x < z.x + 12 && p.x + 12 > z.x && p.y < z.y + 18 && p.y + 20 > z.y;
          if (!hit) continue;
          // Landing on the head is a stomp; anything else is the end.
          const stomp = p.vy > 0.5 && p.y + 20 < z.y + 12;
          if (stomp) {
            z.dying = 10;
            p.vy = -6.6;
            s.kills++;
            setScore(s.kills);
            setBest((b) => {
              const nb = Math.max(b, s.kills);
              try { localStorage.setItem(KEY, String(nb)); } catch { /* ignore */ }
              return nb;
            });
          } else {
            s.dead = true;
            setOver(true);
          }
        }
      }

      // ── draw the same yard you were just looking at ──────────────────────
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = ground; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = stone;
      for (const b of STONES) {
        ctx.beginPath();
        ctx.moveTo(b.x, FLOOR);
        ctx.lineTo(b.x, FLOOR - b.h + b.w / 2);
        ctx.arc(b.x + b.w / 2, FLOOR - b.h + b.w / 2, b.w / 2, Math.PI, 0);
        ctx.lineTo(b.x + b.w, FLOOR);
        ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 0.4; ctx.fillStyle = faint; ctx.fillRect(0, FLOOR, W, 2); ctx.globalAlpha = 1;

      for (const g of st.current.gs) {
        ctx.globalAlpha = 0.3; ctx.fillStyle = ink;
        const gy = g.y + Math.sin(g.bob) * 3;
        ctx.beginPath(); ctx.arc(g.x + 6, gy + 5, 6, Math.PI, 0);
        ctx.fillRect(g.x, gy + 5, 12, 8); ctx.fill();
        ctx.globalAlpha = 1;
      }
      /* Drawn the same way as the silhouettes on the horizon — round head,
         body, arms out in front, two legs out of step. A flat rectangle was
         the reason they read as blocks rather than as the things walking
         across the top of the page. */
      for (const z of st.current.zs) {
        const g = "#5f8f5a";
        ctx.globalAlpha = z.dying ? z.dying / 10 : 1;
        const squash = z.dying ? 0.34 : 1;
        const dir = z.vx > 0 ? 1 : -1;
        const bx = z.x + 6;
        const by = z.y + 18 - 18 * squash;
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(1, squash);
        const sway = Math.sin(st.current.t / 7 + z.x) * 1.4;
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(sway * 0.5, 3, 3.1, 0, 6.283); ctx.fill();   // head
        ctx.fillRect(-2.6 + sway * 0.4, 5.6, 5.4, 8);                          // body
        ctx.lineWidth = 1.9; ctx.strokeStyle = g; ctx.lineCap = "round";
        ctx.beginPath();                                                        // arms out
        ctx.moveTo(sway * 0.4, 7.4); ctx.lineTo(dir * 7.4, 6.2 + sway * 0.3);
        ctx.moveTo(sway * 0.4, 8.6); ctx.lineTo(dir * 6.4, 8.8 - sway * 0.3);
        ctx.stroke();
        ctx.beginPath();                                                        // legs, out of step
        ctx.moveTo(-1.4, 13.4); ctx.lineTo(-1.4 + Math.sin(st.current.t / 6 + z.x) * 2.2, 18);
        ctx.moveTo(1.4, 13.4); ctx.lineTo(1.4 - Math.sin(st.current.t / 6 + z.x) * 2.2, 18);
        ctx.stroke();
        ctx.restore();
        ctx.globalAlpha = 1;
      }
      const pp = st.current.p;
      ctx.fillStyle = ink;
      ctx.beginPath(); ctx.arc(pp.x + 6, pp.y + 3.4, 3.4, 0, 6.283); ctx.fill();
      ctx.fillRect(pp.x + 3, pp.y + 6.4, 6, 8.6);
      ctx.lineWidth = 2; ctx.strokeStyle = ink; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(pp.x + 6, pp.y + 15); ctx.lineTo(pp.x + 3.4, pp.y + 20);
      ctx.moveTo(pp.x + 6, pp.y + 15); ctx.lineTo(pp.x + 8.6, pp.y + 20);
      ctx.moveTo(pp.x + 6, pp.y + 8.4); ctx.lineTo(pp.x + 6 + pp.face * 6, pp.y + 7); // spade arm
      ctx.stroke();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started]);

  useEffect(() => {
    /* The game listens on the window, so while it is open it was eating Space
       and the arrow keys for the WHOLE page — you could not type a space into
       the wall's search box, and the page would not scroll with the arrows.
       Anything typed into a field or a button is not aimed at the game. */
    const typing = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      if (!el || !el.tagName) return false;
      const tag = el.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select" || tag === "button"
        || el.isContentEditable === true;
    };
    const down = (e: KeyboardEvent) => {
      if (typing(e.target)) return;
      keys.current[e.code] = true;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") { e.preventDefault(); jump(); }
      if (e.code === "ArrowLeft" || e.code === "ArrowRight") e.preventDefault();
      if (e.code === "Escape") onExit();
    };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    /* A key held when focus leaves the page would otherwise stay held forever. */
    const blur = () => { keys.current = {}; };
    addEventListener("keydown", down); addEventListener("keyup", up); addEventListener("blur", blur);
    return () => {
      removeEventListener("keydown", down); removeEventListener("keyup", up);
      removeEventListener("blur", blur);
    };
  }, [jump, onExit]);

  const hold = (code: string) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); keys.current[code] = true; },
    onPointerUp: () => { keys.current[code] = false; },
    onPointerLeave: () => { keys.current[code] = false; },
    onPointerCancel: () => { keys.current[code] = false; },
  });
  const pad = "flex h-12 flex-1 items-center justify-center rounded-lg border border-edge text-muted active:border-accent active:text-accent";

  return (
    <div className="select-none">
      <div className="flex items-center justify-between gap-3 pb-2 text-xs text-muted">
        <span className="tabular-nums">
          {score} <span className="text-faint">· best {best}</span>
        </span>
        <span className="hidden text-faint sm:inline">← → to move · space to jump · esc to leave</span>
        <button onClick={onExit} className="underline underline-offset-4 hover:text-accent">leave</button>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-rule">
        <canvas ref={cv} width={W} height={H} className="block w-full touch-none" />
        {(!started || over) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ground/85">
            <p className="text-sm text-ink">{over ? `They got you at ${score}` : "Something is moving out there"}</p>
            <button
              onClick={reset}
              className="rounded-full border border-edge px-4 py-1.5 text-xs text-muted hover:border-accent hover:text-accent"
            >
              {over ? "again" : "drop in"}
            </button>
            <p className="max-w-[19rem] text-center text-[11px] text-faint">
              Land on a zombie to put it down. Touch one any other way and it is over.
              The ghosts do not care about you.
            </p>
          </div>
        )}
      </div>

      {/* Touch controls, on their own row. A phone has no arrow keys, and
          overloading taps on the play area made "tap low to duck" a rule
          nobody could guess. */}
      <div className="mt-2 flex gap-2 sm:hidden">
        <button aria-label="Move left" {...hold("ArrowLeft")} className={pad}>←</button>
        <button aria-label="Jump" onPointerDown={(e) => { e.preventDefault(); jump(); }} className={`${pad} flex-[1.4]`}>jump</button>
        <button aria-label="Move right" {...hold("ArrowRight")} className={pad}>→</button>
      </div>
    </div>
  );
}
