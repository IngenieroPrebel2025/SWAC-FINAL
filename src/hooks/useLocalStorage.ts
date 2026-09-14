"use client";

import { useState, useCallback, useEffect, useRef } from "react";

/**
 * Persist a value to localStorage with a typed getter/setter.
 *
 * Hydration-safe: the first render (server AND client) always returns
 * `initialValue`, then the stored value is applied in an effect after mount.
 * This avoids server/client markup mismatches for values that depend on
 * persisted state (e.g. sidebar width).
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const hydrated = useRef(false);

  /* Read persisted value once after mount. */
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item != null) setValue(JSON.parse(item) as T);
    } catch {
      /* ignore */
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /* Persist on change (after the initial hydration read). */
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => (next instanceof Function ? next(prev) : next));
  }, []);

  return [value, set] as const;
}
