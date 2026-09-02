"use client";

import { useState } from "react";
import { Yard } from "@/components/Yard";
import { YardGame } from "@/components/YardGame";

/** The horizon, until somebody clicks it. Then it is a game.
 *  It stays a plain decorative image for anyone who never clicks, and the
 *  game's code only loads into the page once — it is small enough not to
 *  warrant a dynamic import. */
export function YardPlay({
  className = "",
  playClassName = "",
}: {
  className?: string;
  playClassName?: string;
}) {
  const [playing, setPlaying] = useState(false);

  /* The horizon is deliberately full-bleed, but the game has a score line and
     controls that must sit inside the page gutter — inheriting the negative
     margins pushed "leave" off the right edge of the screen. */
  if (playing) {
    return (
      <div className={playClassName}>
        <YardGame onExit={() => setPlaying(false)} />
      </div>
    );
  }

  return (
    <div className={`${className} group relative`}>
      <Yard zombies />
      <button
        onClick={() => setPlaying(true)}
        className="absolute inset-0 flex items-end justify-center pb-2"
        aria-label="Play the graveyard run"
      >
        <span className="rounded-full border border-edge bg-ground/70 px-3 py-1 text-[11px] text-muted opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100">
          play
        </span>
      </button>
    </div>
  );
}
