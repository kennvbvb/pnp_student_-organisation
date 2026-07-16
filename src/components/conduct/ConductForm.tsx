"use client";

import { useActionState, useEffect, useState } from "react";
import {
  recordConductDeductionAction,
  type FormState,
} from "@/actions/conduct";

export type StudentOption = {
  id: string;
  studentCode: string;
  prefix: string | null;
  firstName: string;
  lastName: string;
  classRoom: string;
  conductScore: number;
};

const initialState: FormState = {};

function DeductionForm({
  student,
  onDone,
}: {
  student: StudentOption;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    recordConductDeductionAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(onDone, 1200);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <tr className="border-b border-slate-100 bg-slate-50">
      <td colSpan={5} className="px-4 py-3">
        <form
          action={formAction}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          <input type="hidden" name="studentId" value={student.id} />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              จำนวนคะแนนที่ลด
            </label>
            <input
              type="number"
              name="amount"
              min={1}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              หมวดหมู่ (ถ้ามี)
            </label>
            <input
              name="category"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              เหตุผล
            </label>
            <input
              name="reason"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {pending ? "กำลังบันทึก..." : "บันทึกลดคะแนน"}
            </button>
            <button
              type="button"
              onClick={onDone}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white"
            >
              ยกเลิก
            </button>
          </div>
          {state.error && (
            <p className="text-sm text-red-600 lg:col-span-5">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="text-sm text-emerald-600 lg:col-span-5">
              {state.success}
            </p>
          )}
        </form>
      </td>
    </tr>
  );
}

export default function ConductStudentList({
  students,
}: {
  students: StudentOption[];
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">รหัสนักเรียน</th>
            <th className="px-4 py-3">ชื่อ-นามสกุล</th>
            <th className="px-4 py-3">ห้อง</th>
            <th className="px-4 py-3">คะแนนความประพฤติปัจจุบัน</th>
            <th className="px-4 py-3 text-right">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) =>
            activeId === s.id ? (
              <DeductionForm
                key={s.id}
                student={s}
                onDone={() => setActiveId(null)}
              />
            ) : (
              <tr key={s.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-slate-600">{s.studentCode}</td>
                <td className="px-4 py-3 font-medium text-slate-800">
                  {s.prefix ?? ""}
                  {s.firstName} {s.lastName}
                </td>
                <td className="px-4 py-3 text-slate-500">{s.classRoom}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      s.conductScore < 60
                        ? "font-semibold text-red-600"
                        : "text-slate-700"
                    }
                  >
                    {s.conductScore}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setActiveId(s.id)}
                    className="text-red-600 hover:underline"
                  >
                    ลดคะแนน
                  </button>
                </td>
              </tr>
            ),
          )}
          {students.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                ไม่พบข้อมูลนักเรียน ลองค้นหาด้วยรหัสหรือชื่อนักเรียน
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
