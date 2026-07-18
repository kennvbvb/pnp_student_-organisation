"use client";

import { useActionState } from "react";
import {
  changePasswordAction,
  type ChangePasswordState,
} from "@/actions/auth";

const initialState: ChangePasswordState = {};

const inputCls =
  "w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20";

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div>
        <label
          htmlFor="cp-current"
          className="mb-1 block text-xs font-medium text-slate-600"
        >
          รหัสผ่านปัจจุบัน
        </label>
        <input
          id="cp-current"
          type="password"
          name="currentPassword"
          required
          autoComplete="current-password"
          className={inputCls}
        />
      </div>
      <div>
        <label
          htmlFor="cp-new"
          className="mb-1 block text-xs font-medium text-slate-600"
        >
          รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)
        </label>
        <input
          id="cp-new"
          type="password"
          name="newPassword"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputCls}
        />
      </div>
      <div>
        <label
          htmlFor="cp-confirm"
          className="mb-1 block text-xs font-medium text-slate-600"
        >
          ยืนยันรหัสผ่านใหม่
        </label>
        <input
          id="cp-confirm"
          type="password"
          name="confirmPassword"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputCls}
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {pending ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
      </button>
    </form>
  );
}
