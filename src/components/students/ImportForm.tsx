"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ImportResult = {
  created: number;
  updated: number;
  errors: string[];
};

export default function ImportForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("กรุณาเลือกไฟล์ Excel");
      return;
    }
    setPending(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
      } else {
        setResult(data);
        router.refresh();
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            เลือกไฟล์ Excel (.xlsx)
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "กำลังนำเข้า..." : "นำเข้าข้อมูล"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 space-y-2">
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            นำเข้าสำเร็จ: สร้างใหม่ {result.created} รายการ, อัปเดต{" "}
            {result.updated} รายการ
          </p>
          {result.errors.length > 0 && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              <p className="font-medium">พบข้อผิดพลาด {result.errors.length} รายการ:</p>
              <ul className="mt-1 list-inside list-disc">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
