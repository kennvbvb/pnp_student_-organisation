import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { logoutAction } from "@/actions/auth";
import ChangePasswordForm from "@/components/account/ChangePasswordForm";

export const metadata = { title: "เปลี่ยนรหัสผ่าน" };

export default async function ChangePasswordPage() {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-800 to-indigo-900 text-lg font-bold text-white shadow-sm shadow-blue-900/30">
            สภ
          </div>
          <h1 className="text-lg font-bold text-slate-800">เปลี่ยนรหัสผ่าน</h1>
          <p className="mt-1 text-sm text-slate-500">
            บัญชี: {user.fullName} ({user.username})
          </p>
        </div>

        {user.mustChangePassword && (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            เพื่อความปลอดภัย กรุณาตั้งรหัสผ่านใหม่ก่อนเริ่มใช้งานระบบ
            (รหัสผ่านเดิมถูกกำหนดโดยผู้ดูแลระบบ)
          </div>
        )}

        <ChangePasswordForm />

        <div className="flex items-center justify-center gap-4 text-sm">
          {!user.mustChangePassword && (
            <Link href="/dashboard" className="text-blue-800 hover:underline">
              ← กลับหน้าหลัก
            </Link>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-slate-400 hover:text-red-600 hover:underline"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
