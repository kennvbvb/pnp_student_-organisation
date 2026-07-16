"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createActivityAction,
  deleteActivityAction,
  type FormState,
} from "@/actions/plan";

export type Activity = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  month: number;
};

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const initialState: FormState = {};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

function AddActivityForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(
    createActivityAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <div className="lg:col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-600">
          ชื่อกิจกรรม
        </label>
        <input
          name="title"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          วันที่เริ่ม
        </label>
        <input
          type="date"
          name="startDate"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          วันที่สิ้นสุด (ถ้ามี)
        </label>
        <input
          type="date"
          name="endDate"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          รายละเอียด
        </label>
        <input
          name="description"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div className="flex items-end lg:col-span-5">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "กำลังบันทึก..." : "เพิ่มกิจกรรม"}
        </button>
        {state.error && (
          <p className="ml-3 text-sm text-red-600">{state.error}</p>
        )}
      </div>
    </form>
  );
}

export default function PlanManager({
  activities,
  canManage,
}: {
  activities: Activity[];
  canManage: boolean;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const grouped = new Map<number, Activity[]>();
  for (const a of activities) {
    const list = grouped.get(a.month) ?? [];
    list.push(a);
    grouped.set(a.month, list);
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div>
          {showAdd ? (
            <AddActivityForm onDone={() => setShowAdd(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              + เพิ่มกิจกรรม
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {THAI_MONTHS.map((monthName, idx) => {
          const month = idx + 1;
          const items = (grouped.get(month) ?? []).sort(
            (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
          );
          return (
            <div
              key={month}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <h3 className="mb-3 text-sm font-semibold text-slate-700">
                {monthName}
              </h3>
              {items.length === 0 ? (
                <p className="text-xs text-slate-400">ไม่มีกิจกรรม</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-lg bg-slate-50 px-3 py-2 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-800">
                            {a.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(a.startDate)}
                            {a.endDate ? ` - ${formatDate(a.endDate)}` : ""}
                          </p>
                          {a.description && (
                            <p className="mt-1 text-xs text-slate-500">
                              {a.description}
                            </p>
                          )}
                        </div>
                        {canManage && (
                          <form action={deleteActivityAction}>
                            <input type="hidden" name="id" value={a.id} />
                            <button
                              type="submit"
                              className="text-xs text-red-600 hover:underline"
                              onClick={(e) => {
                                if (!confirm(`ลบกิจกรรม "${a.title}" ใช่หรือไม่?`)) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              ลบ
                            </button>
                          </form>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
