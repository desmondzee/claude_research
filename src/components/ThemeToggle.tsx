"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

/*
  The theme lives in localStorage and the OS preference, not in React state — an inline
  script in <head> has already applied it before this component ever renders. This subscribes
  to that external value rather than duplicating it.
*/
const listeners = new Set<() => void>();
let snapshot: Theme | null = null;

/** Day is the default — a library is a daylit room. Night is opt-in and remembered. */
function read(): Theme {
  const stored = localStorage.getItem("theme");
  return stored === "dark" ? "dark" : "light";
}

function publish(theme: Theme) {
  snapshot = theme;
  listeners.forEach((listener) => listener());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  publish(read());
  return () => {
    listeners.delete(onChange);
  };
}

/** Null until the client has read the stored theme, so the label never contradicts the page. */
const getSnapshot = () => snapshot;
const getServerSnapshot = (): Theme | null => null;

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
    publish(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to day" : "Switch to night"}
      className="gothic flex h-9 items-center px-3 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-ink-faint transition-colors hover:text-ink"
    >
      <span className="w-9 text-left">
        {theme === null ? "" : theme === "dark" ? "Night" : "Day"}
      </span>
    </button>
  );
}
