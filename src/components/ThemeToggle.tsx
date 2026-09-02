"use client";

import { useEffect, useState } from "react";

const KEY = "fg.theme";

/** Dark unless asked otherwise. The choice is remembered per browser and set
 *  before paint by a tiny inline script in the layout, so a returning visitor
 *  never sees the wrong theme flash first. */
export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.dataset.theme === "light");
  }, []);

  function flip() {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
    try {
      localStorage.setItem(KEY, next ? "light" : "dark");
    } catch {
      /* private mode; the choice just will not survive the tab */
    }
  }

  return (
    <button
      onClick={flip}
      aria-pressed={light}
      aria-label={light ? "Switch to the dark graveyard" : "Switch to the light graveyard"}
      title={light ? "Dark" : "Light"}
      className="rounded-full border border-edge p-2 text-muted transition-colors hover:text-ink"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {light ? (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" fill="currentColor" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4.2" fill="currentColor" />
            <path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
      </svg>
    </button>
  );
}
