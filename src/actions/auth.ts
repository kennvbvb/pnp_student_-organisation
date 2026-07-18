"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, clearSessionCookie } from "@/lib/session";
import { requireUser } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export type LoginState = {
  error?: string;
};

// Lockout: block login for a username after this many failures within the window.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 15;

async function getRequestMeta() {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() ?? null;
  const userAgent = headerList.get("user-agent");
  return { ipAddress, userAgent };
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const { ipAddress, userAgent } = await getRequestMeta();

  if (!username || !password) {
    return { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" };
  }

  // Rate limit: too many recent failures for this username → temporary lockout.
  const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000);
  const recentFailures = await prisma.loginLog.count({
    where: { username, success: false, createdAt: { gte: windowStart } },
  });
  if (recentFailures >= MAX_FAILED_ATTEMPTS) {
    return {
      error: `เข้าสู่ระบบผิดพลาดหลายครั้งเกินไป กรุณารอ ${LOCKOUT_WINDOW_MINUTES} นาทีแล้วลองใหม่`,
    };
  }

  const user = await prisma.user.findUnique({ where: { username } });

  const passwordOk = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!user || !passwordOk || !user.active) {
    await prisma.loginLog.create({
      data: {
        userId: user?.id,
        username,
        success: false,
        ipAddress,
        userAgent,
      },
    });
    return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับ" };
  }

  await prisma.loginLog.create({
    data: {
      userId: user.id,
      username,
      success: true,
      ipAddress,
      userAgent,
    },
  });

  await setSessionCookie(user.id);
  redirect(user.mustChangePassword ? "/account/password" : "/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export type ChangePasswordState = {
  error?: string;
};

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const user = await requireUser();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }
  if (newPassword.length < 8) {
    return { error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "รหัสผ่านใหม่และการยืนยันไม่ตรงกัน" };
  }
  if (newPassword === currentPassword) {
    return { error: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม" };
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !(await bcrypt.compare(currentPassword, dbUser.passwordHash))) {
    return { error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(newPassword, 10),
      mustChangePassword: false,
    },
  });

  await logAudit({
    userId: user.id,
    action: "UPDATE",
    entityType: "User",
    entityId: user.id,
    detail: "เปลี่ยนรหัสผ่านของตนเอง",
  });

  redirect("/dashboard");
}
