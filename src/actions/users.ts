"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import {
  PERMISSIONS,
  ADMIN_ONLY_GRANTABLE,
  isAdminRole,
  ROOT_ADMIN_USERNAME,
  type Permission,
} from "@/lib/permissions";
import type { Role } from "@/generated/prisma/enums";

export type FormState = { error?: string; success?: string };

const VALID_ROLES: Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "PRESIDENT",
  "VICE_PRESIDENT",
  "DEPT_HEAD",
  "MEMBER",
];

function parsePermissions(formData: FormData): Permission[] {
  const values = formData.getAll("permissions").map(String);
  return PERMISSIONS.filter((p) => values.includes(p));
}

export async function createUserAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requirePermission("MANAGE_USERS");

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "") as Role;
  let permissions = parsePermissions(formData);

  if (!username || !password || !fullName || !VALID_ROLES.includes(role)) {
    return { error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }
  if (password.length < 8) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" };
  }

  // Only the primary admin may create another primary admin.
  if (role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    return {
      error: "เฉพาะผู้ดูแลระบบหลักเท่านั้นที่สร้างบัญชีระดับนี้ได้",
    };
  }
  if (!isAdminRole(actor.role)) {
    if (isAdminRole(role)) {
      return { error: "คุณไม่มีสิทธิ์สร้างบัญชีผู้ดูแลระบบ" };
    }
    permissions = permissions.filter(
      (p) => !ADMIN_ONLY_GRANTABLE.includes(p),
    );
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return { error: "มีชื่อผู้ใช้นี้อยู่แล้ว" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      fullName,
      role,
      // Initial passwords are set by an admin — force a change on first login.
      mustChangePassword: true,
      permissions: {
        create: permissions.map((permission) => ({ permission })),
      },
    },
  });

  await logAudit({
    userId: actor.id,
    action: "CREATE",
    entityType: "User",
    entityId: user.id,
    detail: `สร้างผู้ใช้ ${username} (${role})`,
  });

  revalidatePath("/admin/users");
  return { success: "สร้างผู้ใช้เรียบร้อยแล้ว" };
}

export async function updateUserAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requirePermission("MANAGE_USERS");

  const id = String(formData.get("id") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "") as Role;
  const active = formData.get("active") === "on";
  const newPassword = String(formData.get("newPassword") ?? "");
  let permissions = parsePermissions(formData);

  if (!id || !fullName || !VALID_ROLES.includes(role)) {
    return { error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return { error: "ไม่พบผู้ใช้นี้ในระบบ" };
  }

  const actorIsSuperAdmin = actor.role === "SUPER_ADMIN";
  const targetIsSuperAdmin = target.role === "SUPER_ADMIN";

  // The root admin account is editable only by itself.
  if (target.username === ROOT_ADMIN_USERNAME && actor.id !== target.id) {
    return { error: "บัญชีผู้ดูแลระบบหลักสูงสุดแก้ไขได้โดยเจ้าของบัญชีเท่านั้น" };
  }
  // Primary-admin protections: only a super admin may touch a super admin
  // account or assign the role.
  if (targetIsSuperAdmin && !actorIsSuperAdmin) {
    return { error: "คุณไม่มีสิทธิ์แก้ไขบัญชีผู้ดูแลระบบหลัก" };
  }
  if (role === "SUPER_ADMIN" && !actorIsSuperAdmin) {
    return { error: "คุณไม่มีสิทธิ์กำหนดบทบาทผู้ดูแลระบบหลัก" };
  }
  // Regular admins cannot modify other admins (only a super admin can).
  if (
    target.role === "ADMIN" &&
    actor.role === "ADMIN" &&
    actor.id !== target.id
  ) {
    return { error: "ไม่อนุญาตให้แก้ไขบัญชีผู้ดูแลระบบคนอื่น" };
  }

  if (!isAdminRole(actor.role)) {
    if (isAdminRole(target.role)) {
      return { error: "คุณไม่มีสิทธิ์แก้ไขบัญชีผู้ดูแลระบบ" };
    }
    if (isAdminRole(role)) {
      return { error: "คุณไม่มีสิทธิ์ตั้งบัญชีนี้เป็นผู้ดูแลระบบ" };
    }
    permissions = permissions.filter(
      (p) => !ADMIN_ONLY_GRANTABLE.includes(p),
    );
  }

  if (actor.id === id && !active) {
    return { error: "ไม่สามารถระงับบัญชีของตนเองได้" };
  }
  if (actor.id === id && role !== actor.role) {
    return { error: "ไม่สามารถเปลี่ยนบทบาทบัญชีของตนเองได้" };
  }

  if (newPassword && newPassword.length < 8) {
    return { error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // The system must always keep at least one active super admin.
      // Counted inside the transaction to avoid racing concurrent edits.
      if (targetIsSuperAdmin && (!active || role !== "SUPER_ADMIN")) {
        const activeSuperAdmins = await tx.user.count({
          where: { role: "SUPER_ADMIN", active: true },
        });
        if (activeSuperAdmins <= 1) {
          throw new Error("LAST_SUPER_ADMIN");
        }
      }

      await tx.user.update({
        where: { id },
        data: {
          fullName,
          role,
          active,
          ...(newPassword
            ? {
                passwordHash: await bcrypt.hash(newPassword, 10),
                // A password reset by someone else must be changed on next login.
                ...(actor.id !== id ? { mustChangePassword: true } : {}),
              }
            : {}),
        },
      });
      await tx.userPermission.deleteMany({ where: { userId: id } });
      await tx.userPermission.createMany({
        data: permissions.map((permission) => ({ userId: id, permission })),
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "LAST_SUPER_ADMIN") {
      return {
        error: "ระบบต้องมีผู้ดูแลระบบหลักที่ใช้งานอยู่อย่างน้อย 1 บัญชี",
      };
    }
    throw e;
  }

  // Record old → new values for every changed field.
  const changes: string[] = [];
  if (target.fullName !== fullName)
    changes.push(`ชื่อ: "${target.fullName}" → "${fullName}"`);
  if (target.role !== role) changes.push(`บทบาท: ${target.role} → ${role}`);
  if (target.active !== active)
    changes.push(`สถานะ: ${target.active ? "ใช้งาน" : "ระงับ"} → ${active ? "ใช้งาน" : "ระงับ"}`);
  if (newPassword) changes.push("ตั้งรหัสผ่านใหม่");

  await logAudit({
    userId: actor.id,
    action: "UPDATE",
    entityType: "User",
    entityId: id,
    detail: `แก้ไขผู้ใช้ ${target.username}${
      changes.length > 0 ? ` | ${changes.join(", ")}` : ""
    }`,
  });

  revalidatePath("/admin/users");
  return { success: "บันทึกการแก้ไขเรียบร้อยแล้ว" };
}

export async function deleteUserAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requirePermission("MANAGE_USERS");
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { error: "ไม่พบรหัสผู้ใช้" };
  }
  if (actor.id === id) {
    return { error: "ไม่สามารถลบบัญชีของตนเองได้" };
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return { error: "ไม่พบผู้ใช้นี้ในระบบ" };
  }

  // The root admin account can never be deleted from the web UI.
  if (target.username === ROOT_ADMIN_USERNAME) {
    return { error: "ไม่อนุญาตให้ลบบัญชีผู้ดูแลระบบหลักสูงสุด" };
  }
  // Other super admins are deletable only by the root admin account.
  if (
    target.role === "SUPER_ADMIN" &&
    actor.username !== ROOT_ADMIN_USERNAME
  ) {
    return {
      error: "เฉพาะบัญชีผู้ดูแลระบบหลักสูงสุด (admin) เท่านั้นที่ลบผู้ดูแลระบบหลักคนอื่นได้",
    };
  }
  // Regular admins are deletable only by a super admin.
  if (target.role === "ADMIN" && actor.role !== "SUPER_ADMIN") {
    return {
      error: "เฉพาะผู้ดูแลระบบหลักเท่านั้นที่ลบบัญชีผู้ดูแลระบบได้",
    };
  }
  if (!isAdminRole(actor.role) && isAdminRole(target.role)) {
    return { error: "คุณไม่มีสิทธิ์ลบบัญชีผู้ดูแลระบบ" };
  }

  // Log BEFORE deleting so the actor snapshot is written while the target
  // still exists; the log row itself survives via onDelete: SetNull.
  await logAudit({
    userId: actor.id,
    action: "DELETE",
    entityType: "User",
    entityId: id,
    detail: `ลบผู้ใช้ ${target.username} (${target.fullName})`,
  });

  await prisma.user.delete({ where: { id } });

  revalidatePath("/admin/users");
  return { success: `ลบผู้ใช้ ${target.username} เรียบร้อยแล้ว` };
}
