"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export type FormState = { error?: string; success?: string };

export async function createWasteTypeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requirePermission("MANAGE_RECYCLE");

  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const pointsPerUnit = Number(formData.get("pointsPerUnit") ?? 0);

  if (!name || !unit || !Number.isFinite(pointsPerUnit) || pointsPerUnit <= 0) {
    return { error: "กรุณากรอกข้อมูลประเภทขยะให้ครบถ้วนและถูกต้อง" };
  }

  const existing = await prisma.wasteType.findUnique({ where: { name } });
  if (existing) {
    return { error: "มีประเภทขยะนี้อยู่แล้ว" };
  }

  const wasteType = await prisma.wasteType.create({
    data: { name, unit, pointsPerUnit },
  });

  await logAudit({
    userId: user.id,
    action: "CREATE",
    entityType: "WasteType",
    entityId: wasteType.id,
    detail: name,
  });

  revalidatePath("/recycle");
  return { success: "เพิ่มประเภทขยะเรียบร้อยแล้ว" };
}

export async function deleteWasteTypeAction(formData: FormData) {
  const user = await requirePermission("MANAGE_RECYCLE");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const deleted = await prisma.wasteType.delete({ where: { id } });

  await logAudit({
    userId: user.id,
    action: "DELETE",
    entityType: "WasteType",
    entityId: id,
    detail: deleted.name,
  });

  revalidatePath("/recycle");
}

export async function deleteWasteEntryAction(formData: FormData) {
  const user = await requirePermission("DELETE_RECYCLE_HISTORY");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const entry = await prisma.wasteScoreEntry.findUnique({
    where: { id },
    include: { wasteType: { select: { name: true } } },
  });
  if (!entry) return;

  await prisma.wasteScoreEntry.delete({ where: { id } });

  await logAudit({
    userId: user.id,
    action: "DELETE",
    entityType: "WasteScoreEntry",
    entityId: id,
    detail: `ลบประวัติขยะแลกแต้ม ${entry.wasteType.name} ${entry.pointsAwarded} คะแนน`,
  });

  revalidatePath("/recycle/history");
  revalidatePath("/dashboard");
}

export async function recordWasteScoreAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requirePermission("MANAGE_RECYCLE");

  const targetType = String(formData.get("targetType") ?? "");
  const classRoom = String(formData.get("classRoom") ?? "").trim() || null;
  const studentId = String(formData.get("studentId") ?? "").trim() || null;
  const wasteTypeId = String(formData.get("wasteTypeId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const note = String(formData.get("note") ?? "").trim() || null;

  if (targetType !== "ROOM" && targetType !== "STUDENT") {
    return { error: "กรุณาเลือกประเภทการให้คะแนน" };
  }
  if (targetType === "ROOM" && !classRoom) {
    return { error: "กรุณาระบุห้องเรียน" };
  }
  if (targetType === "STUDENT" && !studentId) {
    return { error: "กรุณาเลือกนักเรียน" };
  }
  if (!wasteTypeId || !Number.isFinite(quantity) || quantity <= 0) {
    return { error: "กรุณาเลือกประเภทขยะและระบุจำนวนให้ถูกต้อง" };
  }

  const wasteType = await prisma.wasteType.findUnique({
    where: { id: wasteTypeId },
  });
  if (!wasteType) {
    return { error: "ไม่พบประเภทขยะนี้" };
  }

  const pointsAwarded = quantity * wasteType.pointsPerUnit;

  await prisma.wasteScoreEntry.create({
    data: {
      targetType,
      classRoom: targetType === "ROOM" ? classRoom : null,
      studentId: targetType === "STUDENT" ? studentId : null,
      wasteTypeId,
      quantity,
      pointsAwarded,
      note,
      recordedByUserId: user.id,
    },
  });

  await logAudit({
    userId: user.id,
    action: "CREATE",
    entityType: "WasteScoreEntry",
    detail: `บันทึกคะแนนขยะแลกแต้ม ${wasteType.name} จำนวน ${quantity} ${wasteType.unit} = ${pointsAwarded} คะแนน`,
  });

  revalidatePath("/recycle");
  revalidatePath("/recycle/history");
  return { success: `บันทึกคะแนนสำเร็จ ได้รับ ${pointsAwarded} คะแนน` };
}
