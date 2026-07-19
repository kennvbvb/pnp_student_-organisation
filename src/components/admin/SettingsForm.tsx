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
        <label
          htmlFor="st-schoolname"
          className="mb-1 block text-xs font-medium text-slate-600"
        >
          ชื่อโรงเรียน
        </label>
        <input
          id="st-schoolname"
          name="SCHOOL_NAME"
          defaultValue={settings.SCHOOL_NAME ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="st-sitetitle"
          className="mb-1 block text-xs font-medium text-slate-600"
        >
          ชื่อเว็บไซต์ (แสดงในเมนู)
        </label>
        <input
          id="st-sitetitle"
          name="SITE_TITLE"
          defaultValue={settings.SITE_TITLE ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="st-contact"
          className="mb-1 block text-xs font-medium text-slate-600"
        >
          ข้อมูลติดต่อ
        </label>
        <textarea
          id="st-contact"
          name="CONTACT_INFO"
          defaultValue={settings.CONTACT_INFO ?? ""}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="st-logo"
          className="mb-1 block text-xs font-medium text-slate-600"
        >
          โลโก้โรงเรียน (PNG/JPG/WebP ไม่เกิน 300 KB)
        </label>
        {settings.SCHOOL_LOGO && (
          <div className="mb-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL, not an optimizable remote asset */}
            <img
              src={settings.SCHOOL_LOGO}
              alt="โลโก้โรงเรียนปัจจุบัน"
              className="h-16 w-16 rounded-xl border border-slate-200 object-contain"
            />
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" name="removeLogo" />
              ลบโลโก้ออก (กลับไปใช้ตราสัญลักษณ์เริ่มต้น)
            </label>
          </div>
        )}
        <input
          id="st-logo"
          type="file"
          name="logoFile"
          accept="image/png,image/jpeg,image/webp"
          className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {pending ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </button>
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
      </div>
    </form>
  );
}
