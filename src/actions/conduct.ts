"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export type FormState = { error?: string; success?: string };

// Score bounds: conduct scores stay within [MIN, MAX]; each entry is capped.
const CONDUCT_SCORE_MIN = 0;
const CONDUCT_SCORE_MAX = 100;
const CONDUCT_AMOUNT_PER_ENTRY_MAX = 50;

function clampScore(value: number) {
  return Math.min(CONDUCT_SCORE_MAX, Math.max(CONDUCT_SCORE_MIN, value));
}

export async function recordConductEntryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requirePermission("MANAGE_CONDUCT");

  const studentId = String(formData.get("studentId") ?? "");
  const type = String(formData.get("type") ?? "DEDUCT");
  const amount = Number(formData.get("amount") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;

  if (type !== "ADD" && type !== "DEDUCT") {
    return { error: "ประเภทการบันทึกไม่ถูกต้อง" };
  }
  if (!studentId || !reason) {
    return { error: "กรุณาเลือกนักเรียนและระบุเหตุผล" };
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: "จำนวนคะแนนต้องเป็นจำนวนเต็มที่มากกว่า 0" };
  }
  if (amount > CONDUCT_AMOUNT_PER_ENTRY_MAX) {
    return {
      error: `เพิ่ม/ลดได้ครั้งละไม่เกิน ${CONDUCT_AMOUNT_PER_ENTRY_MAX} คะแนน`,
    };
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });
  if (!student) {
    return { error: "ไม่พบนักเรียนคนนี้ในระบบ" };
  }

  const delta = type === "ADD" ? amount : -amount;
  // Clamp so the stored score never leaves [0, 100].
  const newScore = clampScore(student.conductScore + delta);

  await prisma.$transaction([
    prisma.conductDeduction.create({
      data: {
        studentId,
        type,
        amount,
        reason,
        category,
        recordedByUserId: user.id,
      },
    }),
    prisma.student.update({
      where: { id: studentId },
      data: { conductScore: newScore },
    }),
  ]);

  await logAudit({
    userId: user.id,
    action: type === "ADD" ? "CONDUCT_ADD" : "CONDUCT_DEDUCT",
    entityType: "ConductDeduction",
    entityId: studentId,
    detail: `${type === "ADD" ? "เพิ่ม" : "ลด"}คะแนน ${student.firstName} ${student.lastName} ${amount} คะแนน (${reason})`,
  });

  revalidatePath("/conduct");
  revalidatePath("/conduct/history");
  revalidatePath("/students");
  revalidatePath("/dashboard");
  return {
    success: `${type === "ADD" ? "เพิ่ม" : "ลด"}คะแนนของ ${student.firstName} ${student.lastName} ${amount} คะแนนแล้ว`,
  };
}

/**
 * Soft-cancel a conduct entry: the row is kept for auditability, marked as
 * cancelled with a required reason, and the score effect is reversed.
 */
export async function cancelConductEntryAction(formData: FormData) {
  const user = await requirePermission("DELETE_CONDUCT_HISTORY");
  const id = String(formData.get("id") ?? "");
  const cancelReason = String(formData.get("cancelReason") ?? "").trim();
  if (!id || !cancelReason) return;

  const entry = await prisma.conductDeduction.findUnique({
    where: { id },
    include: { student: true },
  });
  if (!entry || entry.cancelledAt) return;

  // Reverse the score effect: a DEDUCT gave -amount, so undo = +amount (and vice versa).
  const reverseDelta = entry.type === "ADD" ? -entry.amount : entry.amount;
  const newScore = clampScore(entry.student.conductScore + reverseDelta);

  await prisma.$transaction([
    prisma.conductDeduction.update({
      where: { id },
      data: {
        cancelledAt: new Date(),
        cancelledByUserId: user.id,
        cancelReason,
      },
    }),
    prisma.student.update({
      where: { id: entry.studentId },
      data: { conductScore: newScore },
    }),
  ]);

  await logAudit({
    userId: user.id,
    action: "CANCEL",
    entityType: "ConductDeduction",
    entityId: id,
    detail: `ยกเลิกรายการคะแนน ${entry.student.firstName} ${entry.student.lastName} (${entry.type === "ADD" ? "เพิ่ม" : "ลด"} ${entry.amount}) เหตุผล: ${cancelReason}`,
  });

  revalidatePath("/conduct/history");
  revalidatePath("/students");
  revalidatePath("/dashboard");
}

export async function createConductReasonAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requirePermission("MANAGE_CONDUCT");

  const text = String(formData.get("text") ?? "").trim();
  const type = String(formData.get("type") ?? "DEDUCT");

  if (!text) {
    return { error: "กรุณากรอกข้อความเหตุผล" };
  }
  if (type !== "ADD" && type !== "DEDUCT") {
    return { error: "ประเภทไม่ถูกต้อง" };
  }

  const existing = await prisma.conductReason.findUnique({ where: { text } });
  if (existing) {
    return { error: "มีเหตุผลนี้อยู่แล้ว" };
  }

  const reason = await prisma.conductReason.create({
    data: { text, type },
  });

  await logAudit({
    userId: user.id,
    action: "CREATE",
    entityType: "ConductReason",
    entityId: reason.id,
    detail: text,
  });

  revalidatePath("/conduct");
  return { success: "เพิ่มเหตุผลเรียบร้อยแล้ว" };
}

export async function deleteConductReasonAction(formData: FormData) {
  const user = await requirePermission("MANAGE_CONDUCT");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const deleted = await prisma.conductReason.delete({ where: { id } });

  await logAudit({
    userId: user.id,
    action: "DELETE",
    entityType: "ConductReason",
    entityId: id,
    detail: deleted.text,
  });

  revalidatePath("/conduct");
}
