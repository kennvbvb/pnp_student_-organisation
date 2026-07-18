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

  const before = await prisma.student.findUnique({ where: { id } });
  if (!before) {
    return { error: "ไม่พบนักเรียนคนนี้ในระบบ" };
  }

  await prisma.student.update({
    where: { id },
    data: { prefix, firstName, lastName, classRoom, active },
  });

  // Record old → new values for every changed field.
  const changes: string[] = [];
  if ((before.prefix ?? "") !== (prefix ?? ""))
    changes.push(`คำนำหน้า: "${before.prefix ?? "-"}" → "${prefix ?? "-"}"`);
  if (before.firstName !== firstName)
    changes.push(`ชื่อ: "${before.firstName}" → "${firstName}"`);
  if (before.lastName !== lastName)
    changes.push(`นามสกุล: "${before.lastName}" → "${lastName}"`);
  if (before.classRoom !== classRoom)
    changes.push(`ห้อง: "${before.classRoom}" → "${classRoom}"`);
  if (before.active !== active)
    changes.push(`สถานะ: ${before.active ? "ใช้งาน" : "ปิด"} → ${active ? "ใช้งาน" : "ปิด"}`);

  await logAudit({
    userId: user.id,
    action: "UPDATE",
    entityType: "Student",
    entityId: id,
    detail: `${before.studentCode} ${firstName} ${lastName}${
      changes.length > 0 ? ` | ${changes.join(", ")}` : " | ไม่มีการเปลี่ยนแปลง"
    }`,
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
