"use client";

import { useActionState, useState } from "react";
import { recordWasteScoreAction, type FormState } from "@/actions/recycle";

type WasteType = {
  id: string;
  name: string;
  unit: string;
  pointsPerUnit: number;
};

type StudentOption = {
  id: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  classRoom: string;
};

const initialState: FormState = {};

export default function RecordScoreForm({
  wasteTypes,
  students,
  classRooms,
}: {
  wasteTypes: WasteType[];
  students: StudentOption[];
  classRooms: string[];
}) {
  const [state, formAction, pending] = useActionState(
    recordWasteScoreAction,
    initialState,
  );
  const [targetType, setTargetType] = useState<"ROOM" | "STUDENT">("ROOM");

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          บันทึกคะแนนแบบ
        </label>
        <div className="flex gap-4 pt-2">
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="radio"
              name="targetType"
              value="ROOM"
              checked={targetType === "ROOM"}
              onChange={() => setTargetType("ROOM")}
            />
            รายห้อง
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="radio"
              name="targetType"
              value="STUDENT"
              checked={targetType === "STUDENT"}
              onChange={() => setTargetType("STUDENT")}
            />
            รายบุคคล
          </label>
        </div>
      </div>

      {targetType === "ROOM" ? (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            ห้องเรียน
          </label>
          <input
            name="classRoom"
            list="classroom-options"
            required
            placeholder="เช่น ม.1/1"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <datalist id="classroom-options">
            {classRooms.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            นักเรียน
          </label>
          <select
            name="studentId"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">-- เลือกนักเรียน --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.studentCode} {s.firstName} {s.lastName} ({s.classRoom})
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          ประเภทขยะ
        </label>
        <select
          name="wasteTypeId"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">-- เลือกประเภทขยะ --</option>
          {wasteTypes.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.unit} ละ {w.pointsPerUnit} คะแนน)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          จำนวน
        </label>
        <input
          type="number"
          step="any"
          min={0}
          name="quantity"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="lg:col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-600">
          หมายเหตุ (ถ้ามี)
        </label>
        <input
          name="note"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-end lg:col-span-2">
        <button
          type="submit"
          disabled={pending || wasteTypes.length === 0}
          className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {pending ? "กำลังบันทึก..." : "บันทึกคะแนน"}
        </button>
      </div>

      {state.error && (
        <p className="text-sm text-red-600 lg:col-span-4">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-emerald-600 lg:col-span-4">
          {state.success}
        </p>
      )}
    </form>
  );
}
