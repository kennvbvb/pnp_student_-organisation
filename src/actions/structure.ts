"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export type FormState = { error?: string; success?: string };

/** Denormalize the holder's display name from the selected student (kept for simple rendering). */
async function resolveHolderName(holderStudentId: string | null) {
  if (!holderStudentId) return null;
  const student = await prisma.student.findUnique({
    where: { id: holderStudentId },
    select: { prefix: true, firstName: true, lastName: true },
  });
  if (!student) return null;
  return `${student.prefix ?? ""}${student.firstName} ${student.lastName}`;
}

export async function createPositionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requirePermission("MANAGE_STRUCTURE");

  const title = String(formData.get("title") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "") || null;
  const holderStudentId = String(formData.get("holderStudentId") ?? "") || null;
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;

  if (!title) {
    return { error: "กรุณากรอกชื่อตำแหน่ง" };
  }

  const holderName = await resolveHolderName(holderStudentId);

  const position = await prisma.councilPosition.create({
    data: { title, parentId, holderStudentId, holderName, sortOrder },
  });

  await logAudit({
    userId: user.id,
    action: "CREATE",
    entityType: "CouncilPosition",
    entityId: position.id,
    detail: title,
  });

  revalidatePath("/structure");
  revalidatePath("/structure/manage");
  return { success: "เพิ่มตำแหน่งเรียบร้อยแล้ว" };
}

export async function updatePositionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requirePermission("MANAGE_STRUCTURE");

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "") || null;
  const holderStudentId = String(formData.get("holderStudentId") ?? "") || null;
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;

  if (!id || !title) {
    return { error: "ข้อมูลไม่ครบถ้วน" };
  }

  if (parentId === id) {
    return { error: "ตำแหน่งไม่สามารถเป็นระดับบนของตัวเองได้" };
  }

  const holderName = await resolveHolderName(holderStudentId);

  await prisma.councilPosition.update({
    where: { id },
    data: { title, parentId, holderStudentId, holderName, sortOrder },
  });

  await logAudit({
    userId: user.id,
    action: "UPDATE",
    entityType: "CouncilPosition",
    entityId: id,
    detail: title,
  });

  revalidatePath("/structure");
  revalidatePath("/structure/manage");
  return { success: "บันทึกการแก้ไขเรียบร้อยแล้ว" };
}

/** Lightweight inline rename — only changes the position title. */
export async function renamePositionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requirePermission("MANAGE_STRUCTURE");

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!id || !title) {
    return { error: "กรุณากรอกชื่อตำแหน่ง" };
  }

  const before = await prisma.councilPosition.findUnique({ where: { id } });
  if (!before) return { error: "ไม่พบตำแหน่งนี้" };
  if (before.title === title) return { success: "" };

  await prisma.councilPosition.update({ where: { id }, data: { title } });

  await logAudit({
    userId: user.id,
    action: "UPDATE",
    entityType: "CouncilPosition",
    entityId: id,
    detail: `เปลี่ยนชื่อตำแหน่ง: "${before.title}" → "${title}"`,
  });

  revalidatePath("/structure");
  revalidatePath("/structure/manage");
  return { success: "เปลี่ยนชื่อตำแหน่งแล้ว" };
}

export async function deletePositionAction(formData: FormData) {
  const user = await requirePermission("MANAGE_STRUCTURE");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.councilPosition.updateMany({
    where: { parentId: id },
    data: { parentId: null },
  });
  const deleted = await prisma.councilPosition.delete({ where: { id } });

  await logAudit({
    userId: user.id,
    action: "DELETE",
    entityType: "CouncilPosition",
    entityId: id,
    detail: deleted.title,
  });

  revalidatePath("/structure");
  revalidatePath("/structure/manage");
}
