"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export type FormState = { error?: string; success?: string };

function parseDate(value: FormDataEntryValue | null): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createActivityAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requirePermission("MANAGE_PLAN");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const startDate = parseDate(formData.get("startDate"));
  const endDate = parseDate(formData.get("endDate"));

  if (!title || !startDate) {
    return { error: "กรุณากรอกชื่อกิจกรรมและวันที่เริ่ม" };
  }

  const activity = await prisma.planActivity.create({
    data: {
      title,
      description,
      startDate,
      endDate,
      month: startDate.getMonth() + 1,
      year: startDate.getFullYear(),
      createdByUserId: user.id,
    },
  });

  await logAudit({
    userId: user.id,
    action: "CREATE",
    entityType: "PlanActivity",
    entityId: activity.id,
    detail: title,
  });

  revalidatePath("/plan");
  revalidatePath("/dashboard");
  return { success: "เพิ่มกิจกรรมเรียบร้อยแล้ว" };
}

export async function deleteActivityAction(formData: FormData) {
  const user = await requirePermission("MANAGE_PLAN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const deleted = await prisma.planActivity.delete({ where: { id } });

  await logAudit({
    userId: user.id,
    action: "DELETE",
    entityType: "PlanActivity",
    entityId: id,
    detail: deleted.title,
  });

  revalidatePath("/plan");
  revalidatePath("/dashboard");
}
