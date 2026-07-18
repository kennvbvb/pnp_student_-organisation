"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createConductReasonAction,
  deleteConductReasonAction,
  type FormState,
} from "@/actions/conduct";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

type Reason = { id: string; text: string; type: "ADD" | "DEDUCT" };

const initialState: FormState = {};

function AddReasonForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(
    createConductReasonAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex-1">
        <label
          htmlFor="rm-text"
          className="mb-1 block text-xs font-medium text-slate-600"
        >
          เหตุผลใหม่
        </label>
        <input
          id="rm-text"
          name="text"
          required
          placeholder="เช่น ไม่ทำเวร"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="rm-type"
          className="mb-1 block text-xs font-medium text-slate-600"
        >
          ประเภท
        </label>
        <select
          id="rm-type"
          name="type"
          defaultValue="DEDUCT"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="DEDUCT">สำหรับลดคะแนน</option>
          <option value="ADD">สำหรับเพิ่มคะแนน</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        เพิ่ม
      </button>
      {state.error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}

export default function ReasonManager({ reasons }: { reasons: Reason[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          จัดการเหตุผล (Dropdown)
        </h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-sm font-medium text-blue-800 hover:underline"
        >
          {open ? "ปิด" : "+ เพิ่มเหตุผล"}
        </button>
      </div>

      {open && (
        <div className="mb-4">
          <AddReasonForm onDone={() => setOpen(false)} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {reasons.map((r) => (
          <span
            key={r.id}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
              r.type === "ADD"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {r.text}
            <form action={deleteConductReasonAction} className="inline">
              <input type="hidden" name="id" value={r.id} />
              <ConfirmSubmitButton
                message={`ลบเหตุผล "${r.text}" ใช่หรือไม่?`}
                ariaLabel={`ลบเหตุผล ${r.text}`}
                className="text-slate-400 hover:text-red-600"
              >
                ✕
              </ConfirmSubmitButton>
            </form>
          </span>
        ))}
        {reasons.length === 0 && (
          <p className="text-sm text-slate-400">ยังไม่มีเหตุผล</p>
        )}
      </div>
    </div>
  );
}
