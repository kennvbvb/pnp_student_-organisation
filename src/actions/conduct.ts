"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export type FormState = { error?: string; success?: string };

export async function recordConductDeductionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requirePermission("MANAGE_CONDUCT");

  const studentId = String(formData.get("studentId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;

  if (!studentId || !reason) {
    return { error: "กรุณาเลือกนักเรียนและระบุเหตุผล" };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "จำนวนคะแนนที่ลดต้องมากกว่า 0" };
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });
  if (!student) {
    return { error: "ไม่พบนักเรียนคนนี้ในระบบ" };
  }

  await prisma.$transaction([
    prisma.conductDeduction.create({
      data: {
        studentId,
        amount,
        reason,
        category,
        recordedByUserId: user.id,
      },
    }),
    prisma.student.update({
      where: { id: studentId },
      data: { conductScore: { decrement: amount } },
    }),
  ]);

  await logAudit({
    userId: user.id,
    action: "CREATE",
    entityType: "ConductDeduction",
    entityId: studentId,
    detail: `ลดคะแนน ${student.firstName} ${student.lastName} จำนวน ${amount} คะแนน (${reason})`,
  });

  revalidatePath("/conduct");
  revalidatePath("/conduct/history");
  revalidatePath("/students");
  return {
    success: `บันทึกการลดคะแนนของ ${student.firstName} ${student.lastName} จำนวน ${amount} คะแนนแล้ว`,
  };
}
