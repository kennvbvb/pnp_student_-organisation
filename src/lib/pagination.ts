// Pure pagination helpers (no React) so they can be unit-tested.

/** Clamp a raw page-number input to a valid page within [1, totalPages]. */
export function parsePage(value: string | undefined, totalPages: number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.floor(n), Math.max(1, totalPages));
}

/** Page numbers to render, with "…" gaps for large ranges. */
export function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}
