"use client";

import { useActionState } from "react";
import { updateSettingsAction, type FormState } from "@/actions/settings";

const initialState: FormState = {};

export default function SettingsForm({
  settings,
}: {
  settings: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(
    updateSettingsAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-5"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          ชื่อโรงเรียน
        </label>
        <input
          name="SCHOOL_NAME"
          defaultValue={settings.SCHOOL_NAME ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          ชื่อเว็บไซต์ (แสดงในเมนู)
        </label>
        <input
          name="SITE_TITLE"
          defaultValue={settings.SITE_TITLE ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          ข้อมูลติดต่อ
        </label>
        <textarea
          name="CONTACT_INFO"
          defaultValue={settings.CONTACT_INFO ?? ""}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.success && (
          <p className="text-sm text-emerald-600">{state.success}</p>
        )}
      </div>
    </form>
  );
}
