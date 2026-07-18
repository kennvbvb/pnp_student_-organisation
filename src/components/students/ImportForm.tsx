"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PreviewRowStatus = "create" | "update" | "unchanged" | "error";

type PreviewRow = {
  rowNum: number;
  studentCode: string;
  prefix: string | null;
  firstName: string;
  lastName: string;
  classRoom: string;
  status: PreviewRowStatus;
  error?: string;
};

type Summary = {
  create: number;
  update: number;
  unchanged: number;
  error: number;
};

type ApiResult = {
  mode: "preview" | "commit";
  rows: PreviewRow[];
  summary: Summary;
};

const STATUS_META: Record<
  PreviewRowStatus,
  { label: string; className: string }
> = {
  create: { label: "เพิ่มใหม่", className: "bg-emerald-50 text-emerald-700" },
  update: { label: "ปรับปรุง", className: "bg-blue-50 text-blue-800" },
  unchanged: { label: "ไม่เปลี่ยนแปลง", className: "bg-slate-100 text-slate-500" },
  error: { label: "ผิดพลาด", className: "bg-red-50 text-red-600" },
};

export default function ImportForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<ApiResult | null>(null);
  const [committed, setCommitted] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(mode: "preview" | "commit") {
    if (!file) {
      setError("กรุณาเลือกไฟล์ Excel");
      return;
    }
    setPending(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);
      const res = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
      } else if (mode === "preview") {
        setPreview(data);
        setCommitted(null);
      } else {
        setCommitted(data);
        setPreview(null);
        router.refresh();
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
    } finally {
      setPending(false);
    }
  }

  function resetAll() {
    setFile(null);
    setPreview(null);
    setCommitted(null);
    setError(null);
  }

  const applicable = preview
    ? preview.summary.create + preview.summary.update
    : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send("preview");
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <div>
          <label
            htmlFor="import-file"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            เลือกไฟล์ Excel (.xlsx)
          </label>
          <input
            id="import-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setPreview(null);
              setCommitted(null);
              setError(null);
            }}
            className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
          />
        </div>
        <button
          type="submit"
          disabled={pending || !file}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {pending && !preview ? "กำลังตรวจสอบ..." : "ตรวจสอบไฟล์ก่อนนำเข้า"}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {error}
        </p>
      )}

      {/* Step 2: preview — nothing written yet */}
      {preview && (
        <div role="status" className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-slate-700">
              ผลการตรวจสอบ ({preview.rows.length} แถว):
            </span>
            {(
              [
                ["create", preview.summary.create],
                ["update", preview.summary.update],
                ["unchanged", preview.summary.unchanged],
                ["error", preview.summary.error],
              ] as const
            ).map(([status, count]) => (
              <span
                key={status}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_META[status].className}`}
              >
                {STATUS_META[status].label} {count}
              </span>
            ))}
          </div>

          <div className="max-h-80 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">แถว</th>
                  <th className="px-3 py-2">รหัส</th>
                  <th className="px-3 py-2">ชื่อ-นามสกุล</th>
                  <th className="px-3 py-2">ห้อง</th>
                  <th className="px-3 py-2">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr
                    key={r.rowNum}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-2 text-slate-400">{r.rowNum}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {r.studentCode || "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {r.prefix ?? ""}
                      {r.firstName} {r.lastName}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{r.classRoom}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${STATUS_META[r.status].className}`}
                      >
                        {STATUS_META[r.status].label}
                      </span>
                      {r.error && (
                        <span className="mt-0.5 block text-xs text-red-500">
                          {r.error}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => send("commit")}
              disabled={pending || applicable === 0}
              className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {pending
                ? "กำลังนำเข้า..."
                : `ยืนยันนำเข้า (${applicable} รายการ)`}
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            {applicable === 0 && (
              <span className="text-xs text-slate-400">
                ไม่มีแถวที่นำเข้าได้ — ข้อมูลยังไม่ถูกแก้ไข
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            ยังไม่มีการแก้ไขข้อมูลจริงจนกว่าจะกด “ยืนยันนำเข้า”
            (แถวที่ผิดพลาดจะถูกข้าม)
          </p>
        </div>
      )}

      {/* Step 3: committed result */}
      {committed && (
        <div role="status" className="mt-4 space-y-2">
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            นำเข้าสำเร็จ: สร้างใหม่ {committed.summary.create} รายการ, ปรับปรุง{" "}
            {committed.summary.update} รายการ
            {committed.summary.unchanged > 0 &&
              `, ไม่เปลี่ยนแปลง ${committed.summary.unchanged} รายการ`}
          </p>
          {committed.summary.error > 0 && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              <p className="font-medium">
                ข้ามแถวที่ผิดพลาด {committed.summary.error} รายการ:
              </p>
              <ul className="mt-1 list-inside list-disc">
                {committed.rows
                  .filter((r) => r.status === "error")
                  .map((r) => (
                    <li key={r.rowNum}>
                      แถวที่ {r.rowNum}: {r.error}
                    </li>
                  ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={resetAll}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            นำเข้าไฟล์อื่น
          </button>
        </div>
      )}
    </div>
  );
}
