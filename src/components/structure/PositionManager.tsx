"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createPositionAction,
  updatePositionAction,
  deletePositionAction,
  type FormState,
} from "@/actions/structure";

type Position = {
  id: string;
  title: string;
  parentId: string | null;
  holderName: string | null;
  sortOrder: number;
};

const initialState: FormState = {};

function PositionForm({
  positions,
  editing,
  onDone,
}: {
  positions: Position[];
  editing: Position | null;
  onDone: () => void;
}) {
  const action = editing ? updatePositionAction : createPositionAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (editing && state.success) {
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      {editing && <input type="hidden" name="id" value={editing.id} />}
      <div className="lg:col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-600">
          ชื่อตำแหน่ง
        </label>
        <input
          name="title"
          required
          defaultValue={editing?.title ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-800"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          ตำแหน่งระดับบน
        </label>
        <select
          name="parentId"
          defaultValue={editing?.parentId ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-800"
        >
          <option value="">-- ไม่มี (ตำแหน่งสูงสุด) --</option>
          {positions
            .filter((p) => p.id !== editing?.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          ผู้ดำรงตำแหน่ง
        </label>
        <input
          name="holderName"
          defaultValue={editing?.holderName ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-800"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          ลำดับ
        </label>
        <input
          type="number"
          name="sortOrder"
          defaultValue={editing?.sortOrder ?? 0}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-800"
        />
      </div>

      <div className="flex items-end gap-2 lg:col-span-5">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {pending ? "กำลังบันทึก..." : editing ? "บันทึกการแก้ไข" : "เพิ่มตำแหน่ง"}
        </button>
        {editing && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ยกเลิก
          </button>
        )}
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.success && (
          <p className="text-sm text-emerald-600">{state.success}</p>
        )}
      </div>
    </form>
  );
}

export default function PositionManager({
  positions,
}: {
  positions: Position[];
}) {
  const [editing, setEditing] = useState<Position | null>(null);
  const positionMap = new Map(positions.map((p) => [p.id, p.title]));

  return (
    <div className="space-y-6">
      <PositionForm
        positions={positions}
        editing={editing}
        onDone={() => setEditing(null)}
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">ตำแหน่ง</th>
              <th className="px-4 py-3">ระดับบน</th>
              <th className="px-4 py-3">ผู้ดำรงตำแหน่ง</th>
              <th className="px-4 py-3">ลำดับ</th>
              <th className="px-4 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {p.title}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {p.parentId ? positionMap.get(p.parentId) : "-"}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {p.holderName ?? "-"}
                </td>
                <td className="px-4 py-3 text-slate-500">{p.sortOrder}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setEditing(p)}
                    className="mr-3 text-blue-800 hover:underline"
                  >
                    แก้ไข
                  </button>
                  <form action={deletePositionAction} className="inline">
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className="text-red-600 hover:underline"
                      onClick={(e) => {
                        if (!confirm(`ต้องการลบตำแหน่ง "${p.title}" ใช่หรือไม่?`)) {
                          e.preventDefault();
                        }
                      }}
                    >
                      ลบ
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {positions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  ยังไม่มีตำแหน่ง
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
