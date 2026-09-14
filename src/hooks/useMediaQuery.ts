"use client";

import { useState, useEffect } from "react";

/**
 * SSR-safe media query hook. Returns false during the server render and the
 * first client paint, then the real value after mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** True below the lg breakpoint (1024px) — i.e. mobile + tablet. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 1023px)");
}
