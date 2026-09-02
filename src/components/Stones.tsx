"use client";

import { useEffect, useRef, useState } from "react";
import { visitorId } from "@/lib/pulseClient";

/**
 * Leaving a stone.
 *
 * Held, not clicked. A click is a like; half a second of pressure is a small
 * deliberate act, and it makes an accidental tap impossible. The stone drops
 * in and overshoots slightly as it lands — that overshoot is most of the
 * feeling, and the difference between a number changing and an object
 * arriving somewhere.
 *
 * One per visitor per grave, enforced by the primary key on (grave_id, sid),
 * and liftable back off.
 */
const HOLD_MS = 520;

export function Stones({
  graveId,
  initial,
  hydrated,
  compact = false,
}: {
  graveId: number;
  initial: number;
  /** Supplied when a parent has already fetched the whole page's counts, so
   *  a wall of cards costs one request instead of one per card. */
  hydrated?: { total: number; mine: boolean };
  compact?: boolean;
}) {
  const [total, setTotal] = useState(initial);
  const [mine, setMine] = useState(false);
  const [fill, setFill] = useState(0);
  const [landed, setLanded] = useState(false);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (hydrated) {
      setTotal(hydrated.total);
      setMine(hydrated.mine);
      return;
    }
    fetch(`/api/stones?grave=${graveId}&sid=${encodeURIComponent(visitorId())}`)
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.total === "number") setTotal(d.total);
        if (typeof d.mine === "boolean") setMine(d.mine);
      })
      .catch(() => {});
  }, [graveId, hydrated?.total, hydrated?.mine]);

  async function toggle() {
    const next = !mine;
    setMine(next);
    setTotal((n) => n + (next ? 1 : -1));
    if (next) {
      setLanded(true);
      setTimeout(() => setLanded(false), 600);
    }
    try {
      const r = await fetch("/api/stones", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ grave: graveId, sid: visitorId(), on: next }),
      });
      const d = await r.json();
      if (typeof d.total === "number") setTotal(d.total);
      if (typeof d.mine === "boolean") setMine(d.mine);
    } catch {
      // Put it back the way it was rather than leaving a lie on screen.
      setMine(!next);
      setTotal((n) => n - (next ? 1 : -1));
    }
  }

  function down(e: React.PointerEvent) {
    e.preventDefault();
    if (mine) return void toggle(); // lifting yours back off is immediate
    start.current = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - (start.current ?? now)) / HOLD_MS);
      setFill(p);
      if (p >= 1) {
        setFill(0);
        start.current = null;
        void toggle();
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }

  function up() {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    start.current = null;
    setFill(0);
  }

  return (
    <div className={`flex flex-wrap items-center ${compact ? "gap-x-2.5 gap-y-1" : "gap-x-4 gap-y-2"}`}>
      <button
        onPointerDown={down}
        onPointerUp={up}
        onPointerLeave={up}
        onPointerCancel={up}
        aria-pressed={mine}
        aria-label={mine ? "Lift your stone back off" : "Hold to leave a stone"}
        className={`relative touch-none overflow-hidden rounded-full border transition-colors select-none ${
          compact ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm"
        } ${mine ? "border-accent text-accent" : "border-edge text-muted hover:text-body"}`}
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-accent/20"
          style={{ width: `${fill * 100}%` }}
        />
        <span className="relative">
          {mine
            ? compact ? "your stone" : "your stone is here"
            : compact ? "hold to leave a stone" : "hold to leave a stone"}
        </span>
      </button>

      <div className="flex items-end gap-1" aria-hidden>
        {Array.from({ length: Math.min(compact ? 4 : 6, total) }, (_, i) => (
          <span
            key={i}
            className={i === 0 && landed ? "stone-drop" : ""}
            style={{
              width: 6 + ((i * 3) % 4),
              height: 4 + ((i * 2) % 3),
              borderRadius: "50% 50% 34% 34%",
              background: ["#5d646d", "#6b7280", "#565d66", "#77808c"][i % 4],
            }}
          />
        ))}
      </div>

      <span className={`${compact ? "text-xs" : "text-sm"} text-muted tabular-nums`}>
        {total} {total === 1 ? "stone" : "stones"}
      </span>
    </div>
  );
}
