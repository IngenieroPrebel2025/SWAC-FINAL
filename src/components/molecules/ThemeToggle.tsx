"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
      aria-pressed={dark}
      style={{
        position: "relative",
        width: 52,
        height: 26,
        borderRadius: 50,
        border: "1px solid var(--hd-divider)",
        background: dark ? "#143259" : "#DAE4EE",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 220ms",
        display: "flex",
        alignItems: "center",
        padding: "0 3px",
      }}
    >
      {/* Sun */}
      <span
        className="pointer-events-none absolute left-1.5 flex"
        style={{ color: dark ? "rgba(184,200,216,0.35)" : "#F27D72" }}
        aria-hidden="true"
      >
        <Sun size={11} strokeWidth={2} />
      </span>

      {/* Moon */}
      <span
        className="pointer-events-none absolute right-1.5 flex"
        style={{ color: dark ? "#9BBDD9" : "rgba(5,19,38,0.25)" }}
        aria-hidden="true"
      >
        <Moon size={11} strokeWidth={2} />
      </span>

      {/* Thumb */}
      <span
        aria-hidden="true"
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: dark ? "#6595BF" : "#ffffff",
          boxShadow: dark
            ? "0 1px 6px rgba(101,149,191,0.45)"
            : "0 1px 4px rgba(5,19,38,0.18)",
          display: "block",
          flexShrink: 0,
          transform: dark ? "translateX(26px)" : "translateX(0)",
          transition: "transform 240ms cubic-bezier(.4,0,.2,1)",
        }}
      />
    </button>
  );
}
