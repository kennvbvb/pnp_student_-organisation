"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export type FormState = { error?: string; success?: string };

const EDITABLE_KEYS = ["SCHOOL_NAME", "SITE_TITLE", "CONTACT_INFO"] as const;

export async function updateSettingsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requirePermission("MANAGE_SETTINGS");

  await prisma.$transaction(
    EDITABLE_KEYS.map((key) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: String(formData.get(key) ?? "").trim() },
        update: { value: String(formData.get(key) ?? "").trim() },
      }),
    ),
  );

  await logAudit({
    userId: user.id,
    action: "UPDATE",
    entityType: "SiteSetting",
    detail: "แก้ไขตั้งค่าเว็บไซต์",
  });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { success: "บันทึกการตั้งค่าเรียบร้อยแล้ว" };
}
