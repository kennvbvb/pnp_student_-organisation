"use client";

import { useActionState, useMemo, useState } from "react";
import {
  recordConductEntryAction,
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

export type ReasonOption = {
  id: string;
  text: string;
  type: "ADD" | "DEDUCT";
};

const initialState: FormState = {};

export default function ConductForm({
  students,
  classRooms,
  reasons,
}: {
  students: StudentOption[];
  classRooms: string[];
  reasons: ReasonOption[];
}) {
  const [type, setType] = useState<"ADD" | "DEDUCT">("DEDUCT");
  const [classRoom, setClassRoom] = useState("");
  const [studentId, setStudentId] = useState("");
  const [reasonMode, setReasonMode] = useState<"select" | "custom">("select");
  const [reasonSelect, setReasonSelect] = useState("");

  // Wrap the server action so we can clear the selection on success without an effect.
  const [state, formAction, pending] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await recordConductEntryAction(prev, formData);
      if (result.success) {
        setStudentId("");
        setReasonSelect("");
      }
      return result;
    },
    initialState,
  );

  // Students filtered by the chosen classroom (feature 8: cascade dropdown)
  const filteredStudents = useMemo(
    () =>
      classRoom ? students.filter((s) => s.classRoom === classRoom) : [],
    [students, classRoom],
  );

  const filteredReasons = reasons.filter((r) => r.type === type);
  const selectedStudent = filteredStudents.find((s) => s.id === studentId);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="type" value={type} />

      {/* Add / Deduct toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("DEDUCT")}
          className={`flex-1 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
            type === "DEDUCT"
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-slate-200 text-slate-500 hover:bg-slate-50"
          }`}
        >
          ลดคะแนน
        </button>
        <button
          type="button"
          onClick={() => setType("ADD")}
          className={`flex-1 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
            type === "ADD"
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-slate-200 text-slate-500 hover:bg-slate-50"
          }`}
        >
          เพิ่มคะแนน
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Step 1: classroom */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            1. เลือกชั้น/ห้อง
          </label>
          <select
            value={classRoom}
            onChange={(e) => {
              setClassRoom(e.target.value);
              setStudentId("");
            }}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
          >
            <option value="">-- เลือกห้อง --</option>
            {classRooms.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: student (filtered by classroom) */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            2. เลือกนักเรียน
          </label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled={!classRoom}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">
              {classRoom ? "-- เลือกนักเรียน --" : "เลือกห้องก่อน"}
            </option>
            {filteredStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.studentCode} {s.firstName} {s.lastName} (คะแนน {s.conductScore})
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            จำนวนคะแนน
          </label>
          <input
            type="number"
            name="amount"
            min={1}
            required
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
          />
        </div>

        {/* Reason dropdown (feature 3) */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            เหตุผล
          </label>
          {reasonMode === "select" ? (
            <div className="space-y-1">
              <select
                name="reason"
                value={reasonSelect}
                onChange={(e) => {
                  if (e.target.value === "__custom__") {
                    setReasonMode("custom");
                    setReasonSelect("");
                  } else {
                    setReasonSelect(e.target.value);
                  }
                }}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
              >
                <option value="">-- เลือกเหตุผล --</option>
                {filteredReasons.map((r) => (
                  <option key={r.id} value={r.text}>
                    {r.text}
                  </option>
                ))}
                <option value="__custom__">+ พิมพ์เหตุผลอื่น...</option>
              </select>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                name="reason"
                required
                autoFocus
                placeholder="พิมพ์เหตุผล"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
              />
              <button
                type="button"
                onClick={() => setReasonMode("select")}
                className="shrink-0 rounded-xl border border-slate-300 px-3 text-xs text-slate-500 hover:bg-slate-50"
              >
                เลือกจากรายการ
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || !studentId}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50 ${
            type === "ADD"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {pending
            ? "กำลังบันทึก..."
            : type === "ADD"
              ? "บันทึกเพิ่มคะแนน"
              : "บันทึกลดคะแนน"}
        </button>
        {selectedStudent && (
          <span className="text-sm text-slate-500">
            คะแนนปัจจุบัน: <strong>{selectedStudent.conductScore}</strong>
          </span>
        )}
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.success && (
          <p className="text-sm text-emerald-600">{state.success}</p>
        )}
      </div>
    </form>
  );
}
