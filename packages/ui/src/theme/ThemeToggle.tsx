"use client";

import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";

const sun = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const moon = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === "dark";
  const classes = `batho-theme-toggle${className ? " " + className : ""}`;

  // Pre-hydration: render a stable, theme-agnostic skeleton with the same
  // structure as the real toggle so server and client markup match.
  if (!mounted) {
    return (
      <button
        type="button"
        suppressHydrationWarning
        aria-label="Theme"
        className={classes}
        style={{ visibility: "hidden" }}
      >
        <span className="batho-theme-toggle__icon" aria-hidden="true" />
        <span className="batho-theme-toggle__label">Theme</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className={classes}
    >
      <span className="batho-theme-toggle__icon">{isDark ? sun : moon}</span>
      <span className="batho-theme-toggle__label">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
