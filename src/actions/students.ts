"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export type FormState = { error?: string; success?: string };

export async function createStudentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requirePermission("MANAGE_STUDENTS");

  const studentCode = String(formData.get("studentCode") ?? "").trim();
  const prefix = String(formData.get("prefix") ?? "").trim() || null;
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const classRoom = String(formData.get("classRoom") ?? "").trim();

  if (!studentCode || !firstName || !lastName || !classRoom) {
    return { error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  const existing = await prisma.student.findUnique({
    where: { studentCode },
  });
  if (existing) {
    return { error: "มีรหัสนักเรียนนี้อยู่แล้วในระบบ" };
  }

  const student = await prisma.student.create({
    data: { studentCode, prefix, firstName, lastName, classRoom },
  });

  await logAudit({
    userId: user.id,
    action: "CREATE",
    entityType: "Student",
    entityId: student.id,
    detail: `${studentCode} ${firstName} ${lastName}`,
  });

  revalidatePath("/students");
  return { success: "เพิ่มนักเรียนเรียบร้อยแล้ว" };
}

export async function updateStudentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requirePermission("MANAGE_STUDENTS");

  const id = String(formData.get("id") ?? "");
  const prefix = String(formData.get("prefix") ?? "").trim() || null;
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const classRoom = String(formData.get("classRoom") ?? "").trim();
  const active = formData.get("active") === "on";

  if (!id || !firstName || !lastName || !classRoom) {
    return { error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  await prisma.student.update({
    where: { id },
    data: { prefix, firstName, lastName, classRoom, active },
  });

  await logAudit({
    userId: user.id,
    action: "UPDATE",
    entityType: "Student",
    entityId: id,
    detail: `${firstName} ${lastName}`,
  });

  revalidatePath("/students");
  return { success: "บันทึกการแก้ไขเรียบร้อยแล้ว" };
}

export async function deleteStudentAction(formData: FormData) {
  const user = await requirePermission("MANAGE_STUDENTS");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const deleted = await prisma.student.delete({ where: { id } });

  await logAudit({
    userId: user.id,
    action: "DELETE",
    entityType: "Student",
    entityId: id,
    detail: `${deleted.firstName} ${deleted.lastName}`,
  });

  revalidatePath("/students");
}
