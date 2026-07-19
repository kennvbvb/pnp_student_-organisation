"use client";

import { useActionState, useState } from "react";
import {
  startNewAcademicYearAction,
  type FormState,
} from "@/actions/academic-year";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

type WizardRow = {
  classRoom: string;
  count: number;
  suggestedTarget: string;
  suggestedGraduate: boolean;
};

type RowState = { target: string; graduate: boolean };

const initialState: FormState = {};

/**
 * Year-rollover wizard: shows every active classroom with an editable
 * promotion target (or graduation), then closes the current year and
 * opens the new one in a single confirmed action.
 */
export default function StartYearWizard({
  currentYear,
  defaultNewYear,
  rows,
}: {
  currentYear: number;
  defaultNewYear: number;
  rows: WizardRow[];
}) {
  const [state, formAction, pending] = useActionState(
    startNewAcademicYearAction,
    initialState,
  );
  const [newYear, setNewYear] = useState(String(defaultNewYear));
  const [rowStates, setRowStates] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      rows.map((r) => [
        r.classRoom,
        { target: r.suggestedTarget, graduate: r.suggestedGraduate },
      ]),
    ),
  );

  function setRow(classRoom: string, patch: Partial<RowState>) {
    setRowStates((prev) => ({
      ...prev,
      [classRoom]: { ...prev[classRoom], ...patch },
    }));
  }

  const mappings = rows.map((r) => ({
    classRoom: r.classRoom,
    target: rowStates[r.classRoom]?.target ?? r.classRoom,
    graduate: rowStates[r.classRoom]?.graduate ?? false,
  }));
  const invalidRows = mappings.filter((m) => !m.graduate && !m.target.trim());
  const graduatingCount = rows
    .filter((r) => rowStates[r.classRoom]?.graduate)
    .reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
      <h2 className="text-sm font-bold text-slate-800">
        ปิดปีการศึกษา {currentYear} และเปิดปีการศึกษาใหม่
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        ตรวจสอบผังการเลื่อนชั้นด้านล่าง แก้ไขห้องปลายทางหรือเลือก
        “จบการศึกษา” ได้ตามจริง เมื่อยืนยันแล้ว: ปี {currentYear}{" "}
        จะถูกปิด (ดูย้อนหลังได้แต่แก้ไขไม่ได้), นักเรียนถูกเลื่อนชั้น/จบตามผัง,
        และคะแนนความประพฤติของนักเรียนที่ยังศึกษาอยู่จะรีเซ็ตเป็น 100
      </p>

      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="mappings" value={JSON.stringify(mappings)} />

        <div>
          <label
            htmlFor="ay-newyear"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            ปีการศึกษาใหม่ (พ.ศ.)
          </label>
          <input
            id="ay-newyear"
            type="number"
            name="newYear"
            value={newYear}
            onChange={(e) => setNewYear(e.target.value)}
            required
            min={currentYear + 1}
            className="w-36 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">ห้องปัจจุบัน</th>
                <th className="px-4 py-3">จำนวนนักเรียน</th>
                <th className="px-4 py-3">เลื่อนไปห้อง</th>
                <th className="px-4 py-3">จบการศึกษา</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const rs = rowStates[r.classRoom];
                return (
                  <tr
                    key={r.classRoom}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-800">
                      {r.classRoom}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {r.count} คน
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="text"
                        value={rs?.graduate ? "" : (rs?.target ?? "")}
                        onChange={(e) =>
                          setRow(r.classRoom, { target: e.target.value })
                        }
                        disabled={rs?.graduate}
                        aria-label={`ห้องปลายทางของ ${r.classRoom}`}
                        placeholder={rs?.graduate ? "— จบการศึกษา —" : "เช่น ป.2/1"}
                        className="w-32 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20 disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={rs?.graduate ?? false}
                          onChange={(e) =>
                            setRow(r.classRoom, { graduate: e.target.checked })
                          }
                        />
                        จบการศึกษา
                      </label>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    ไม่มีนักเรียนที่ใช้งานอยู่ — เปิดปีใหม่ได้โดยไม่มีการเลื่อนชั้น
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {invalidRows.length > 0 && (
          <p role="alert" className="text-xs text-red-600">
            กรุณาระบุห้องปลายทางของ:{" "}
            {invalidRows.map((m) => m.classRoom).join(", ")}{" "}
            (หรือเลือกจบการศึกษา)
          </p>
        )}
        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        {state.success && (
          <p role="status" className="text-sm text-emerald-600">
            {state.success}
          </p>
        )}

        <ConfirmSubmitButton
          title="ยืนยันการเปิดปีการศึกษาใหม่"
          message={`ปิดปีการศึกษา ${currentYear} และเปิดปีการศึกษา ${newYear || "ใหม่"} ใช่หรือไม่?`}
          detail={`นักเรียนจะถูกเลื่อนชั้นตามผังที่ตั้งไว้${graduatingCount > 0 ? `, จบการศึกษา ${graduatingCount} คน` : ""} และคะแนนความประพฤติจะรีเซ็ตเป็น 100 — การกระทำนี้ย้อนกลับไม่ได้`}
          confirmLabel="เปิดปีใหม่"
          className="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {pending ? "กำลังดำเนินการ..." : `ปิดปี ${currentYear} และเปิดปีใหม่`}
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
