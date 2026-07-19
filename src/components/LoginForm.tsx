"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/actions/auth";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-white/20 bg-white/95 p-6 shadow-xl backdrop-blur"
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            ชื่อผู้ใช้
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            autoComplete="username"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition-colors focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            รหัสผ่าน
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition-colors focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
          />
        </div>
      </div>

      {state.error && (
        <p className="mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-900/30 transition-all hover:from-blue-800 hover:to-indigo-800 hover:shadow-md disabled:opacity-60"
      >
        {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
