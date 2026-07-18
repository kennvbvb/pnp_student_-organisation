"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createWasteTypeAction,
  deleteWasteTypeAction,
  type FormState,
} from "@/actions/recycle";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

type WasteType = {
  id: string;
  name: string;
  unit: string;
  pointsPerUnit: number;
};

const initialState: FormState = {};

function AddWasteTypeForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(
    createWasteTypeAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input
        name="name"
        aria-label="ชื่อประเภทขยะ"
        placeholder="ชื่อประเภทขยะ"
        required
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="unit"
        aria-label="วิธีนับ"
        placeholder="วิธีนับ เช่น กิโลกรัม, ชิ้น"
        required
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        type="number"
        step="any"
        min={0}
        name="pointsPerUnit"
        aria-label="คะแนนต่อหน่วย"
        placeholder="คะแนนต่อหน่วย"
        required
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {pending ? "กำลังบันทึก..." : "เพิ่มประเภทขยะ"}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-red-600 sm:col-span-2 lg:col-span-4">
          {state.error}
        </p>
      )}
    </form>
  );
}

export default function WasteTypeManager({
  wasteTypes,
}: {
  wasteTypes: WasteType[];
}) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          ประเภทขยะและคะแนน
        </h3>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="text-sm text-blue-800 hover:underline"
        >
          {showAdd ? "ปิด" : "+ เพิ่มประเภทขยะ"}
        </button>
      </div>

      {showAdd && (
        <div className="mb-4">
          <AddWasteTypeForm onDone={() => setShowAdd(false)} />
        </div>
      )}

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {wasteTypes.map((w) => (
          <li
            key={w.id}
            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
          >
            <span>
              {w.name}{" "}
              <span className="text-xs text-slate-500">
                ({w.unit} ละ {w.pointsPerUnit} คะแนน)
              </span>
            </span>
            <form action={deleteWasteTypeAction}>
              <input type="hidden" name="id" value={w.id} />
              <ConfirmSubmitButton
                message={`ต้องการลบประเภทขยะ "${w.name}" ใช่หรือไม่?`}
                className="text-xs text-red-600 hover:underline"
              >
                ลบ
              </ConfirmSubmitButton>
            </form>
          </li>
        ))}
        {wasteTypes.length === 0 && (
          <li className="text-sm text-slate-400">ยังไม่มีประเภทขยะ</li>
        )}
      </ul>
    </div>
  );
}
