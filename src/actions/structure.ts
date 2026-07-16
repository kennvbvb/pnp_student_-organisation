"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export type FormState = { error?: string; success?: string };

export async function createPositionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requirePermission("MANAGE_STRUCTURE");

  const title = String(formData.get("title") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "") || null;
  const holderName = String(formData.get("holderName") ?? "").trim() || null;
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;

  if (!title) {
    return { error: "กรุณากรอกชื่อตำแหน่ง" };
  }

  const position = await prisma.councilPosition.create({
    data: { title, parentId, holderName, sortOrder },
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
  const holderName = String(formData.get("holderName") ?? "").trim() || null;
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;

  if (!id || !title) {
    return { error: "ข้อมูลไม่ครบถ้วน" };
  }

  if (parentId === id) {
    return { error: "ตำแหน่งไม่สามารถเป็นระดับบนของตัวเองได้" };
  }

  await prisma.councilPosition.update({
    where: { id },
    data: { title, parentId, holderName, sortOrder },
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
