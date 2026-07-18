"use client";

import { useEffect } from "react";

/** Deterministic short code derived from the error text (pure). */
function hashCode(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).toUpperCase().padStart(6, "0");
}

/** Friendly error page: no stack traces, just a reference code for admins. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Next.js sets a digest for server errors; otherwise derive a stable code
  // from the error text so users can report something searchable.
  const referenceCode =
    error.digest ?? `C-${hashCode(error.message || error.name || "ERROR")}`;

  useEffect(() => {
    // Log for debugging in the browser console only — users see the friendly page.
    console.error(`[${referenceCode}]`, error);
  }, [error, referenceCode]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl">
        ⚠️
      </div>
      <div>
        <h1 className="text-lg font-bold text-slate-800">
          เกิดข้อผิดพลาดในระบบ
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          กรุณาลองใหม่อีกครั้ง หากยังพบปัญหาให้แจ้งผู้ดูแลระบบพร้อมรหัสอ้างอิงด้านล่าง
        </p>
        <p className="mt-2 font-mono text-xs text-slate-400">
          รหัสอ้างอิง: {referenceCode}
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
      >
        ลองใหม่อีกครั้ง
      </button>
    </div>
  );
}
