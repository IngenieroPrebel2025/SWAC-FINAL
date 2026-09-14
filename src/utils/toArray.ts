/**
 * Normalizes API responses to a plain array.
 * Handles both:
 *   - Plain arrays:               [{ id: 1, ... }, ...]
 *   - DRF paginated responses:    { count: N, results: [...] }
 */
export function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (
    value !== null &&
    typeof value === "object" &&
    "results" in value &&
    Array.isArray((value as Record<string, unknown>).results)
  ) {
    return (value as { results: T[] }).results;
  }
  return [];
}
