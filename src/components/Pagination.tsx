import Link from "next/link";

/** Clamp a raw page-number input to a valid page within [1, totalPages]. */
export function parsePage(value: string | undefined, totalPages: number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.floor(n), Math.max(1, totalPages));
}

function pageWindow(current: number, total: number): (number | "…")[] {
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

export default function Pagination({
  page,
  pageSize,
  total,
  params = {},
  pageKey = "page",
}: {
  page: number;
  pageSize: number;
  total: number;
  params?: Record<string, string | undefined>;
  pageKey?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function href(p: number) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v && k !== pageKey) sp.set(k, v);
    }
    sp.set(pageKey, String(p));
    return `?${sp.toString()}`;
  }

  const linkBase =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm transition-colors";

  return (
    <nav
      className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row"
      aria-label="การแบ่งหน้า"
    >
      <p className="text-xs text-slate-500" aria-live="polite">
        {total === 0
          ? "ไม่มีรายการ"
          : `รายการ ${from}–${to} จาก ${total}`}
      </p>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {page > 1 ? (
            <Link
              href={href(page - 1)}
              rel="prev"
              aria-label="หน้าก่อนหน้า"
              className={`${linkBase} border-slate-300 text-slate-600 hover:bg-slate-50`}
            >
              ‹
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className={`${linkBase} border-slate-200 text-slate-300`}
            >
              ‹
            </span>
          )}

          {pageWindow(page, totalPages).map((p, i) =>
            p === "…" ? (
              <span
                key={`e${i}`}
                className="px-1 text-sm text-slate-400"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <Link
                key={p}
                href={href(p)}
                aria-label={`หน้า ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={`${linkBase} ${
                  p === page
                    ? "border-blue-900 bg-blue-900 font-semibold text-white"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p}
              </Link>
            ),
          )}

          {page < totalPages ? (
            <Link
              href={href(page + 1)}
              rel="next"
              aria-label="หน้าถัดไป"
              className={`${linkBase} border-slate-300 text-slate-600 hover:bg-slate-50`}
            >
              ›
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className={`${linkBase} border-slate-200 text-slate-300`}
            >
              ›
            </span>
          )}
        </div>
      )}
    </nav>
  );
}
