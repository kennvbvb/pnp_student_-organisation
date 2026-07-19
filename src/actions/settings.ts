"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

export type FormState = { error?: string; success?: string };

const EDITABLE_KEYS = ["SCHOOL_NAME", "SITE_TITLE", "CONTACT_INFO"] as const;

// Logo is stored as a data URL in SiteSetting — no filesystem needed,
// which keeps it working on serverless hosting.
const LOGO_MAX_BYTES = 300 * 1024;
const LOGO_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function updateSettingsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requirePermission("MANAGE_SETTINGS");

  const logoFile = formData.get("logoFile");
  const removeLogo = formData.get("removeLogo") === "on";
  let logoDataUrl: string | null = null;

  if (logoFile instanceof File && logoFile.size > 0) {
    if (!LOGO_ALLOWED_TYPES.includes(logoFile.type)) {
      return { error: "โลโก้ต้องเป็นไฟล์ PNG, JPG หรือ WebP เท่านั้น" };
    }
    if (logoFile.size > LOGO_MAX_BYTES) {
      return { error: "ไฟล์โลโก้ต้องมีขนาดไม่เกิน 300 KB" };
    }
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    logoDataUrl = `data:${logoFile.type};base64,${buffer.toString("base64")}`;
  }

  await prisma.$transaction([
    ...EDITABLE_KEYS.map((key) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: String(formData.get(key) ?? "").trim() },
        update: { value: String(formData.get(key) ?? "").trim() },
      }),
    ),
    ...(removeLogo
      ? [prisma.siteSetting.deleteMany({ where: { key: "SCHOOL_LOGO" } })]
      : logoDataUrl
        ? [
            prisma.siteSetting.upsert({
              where: { key: "SCHOOL_LOGO" },
              create: { key: "SCHOOL_LOGO", value: logoDataUrl },
              update: { value: logoDataUrl },
            }),
          ]
        : []),
  ]);

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
