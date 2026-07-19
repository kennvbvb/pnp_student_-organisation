"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import { getCurrentAcademicYear } from "@/lib/academic-year";

export type FormState = { error?: string; success?: string };

type Mapping = { classRoom: string; target: string; graduate: boolean };

function parseMappings(raw: string): Mapping[] | null {
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return null;
    const mappings: Mapping[] = [];
    for (const item of data) {
      if (typeof item?.classRoom !== "string") return null;
      const graduate = item.graduate === true;
      const target = String(item.target ?? "").trim();
      if (!graduate && !target) return null;
      mappings.push({ classRoom: item.classRoom, target, graduate });
    }
    return mappings;
  } catch {
    return null;
  }
}

/**
 * Close the current academic year and open a new one:
 * - the old year becomes closed (read-only for score entries)
 * - each classroom's active students are promoted to their mapped target
 *   classroom, or marked graduated (inactive + graduatedYear)
 * - conduct scores of remaining active students reset to 100
 * All inside one transaction.
 */
export async function startNewAcademicYearAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requirePermission("MANAGE_SETTINGS");

  const newYear = Number(formData.get("newYear"));
  const mappings = parseMappings(String(formData.get("mappings") ?? ""));

  if (!Number.isInteger(newYear) || newYear < 2500 || newYear > 2700) {
    return { error: "กรุณาระบุปีการศึกษาใหม่ให้ถูกต้อง (พ.ศ.)" };
  }
  if (!mappings) {
    return { error: "ข้อมูลการเลื่อนชั้นไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" };
  }

  const current = await getCurrentAcademicYear();
  if (newYear <= current.year) {
    return {
      error: `ปีการศึกษาใหม่ต้องมากกว่าปีปัจจุบัน (${current.year})`,
    };
  }
  const existing = await prisma.academicYear.findUnique({
    where: { year: newYear },
  });
  if (existing) {
    return { error: `มีปีการศึกษา ${newYear} อยู่แล้วในระบบ` };
  }

  // Snapshot student ids per classroom BEFORE any rename, so chained
  // promotions (ป.1/1 → ป.2/1 while ป.2/1 → ป.3/1) can't double-apply.
  const groups = await Promise.all(
    mappings.map((m) =>
      prisma.student
        .findMany({
          where: { classRoom: m.classRoom, active: true },
          select: { id: true },
        })
        .then((students) => ({
          mapping: m,
          ids: students.map((s) => s.id),
        })),
    ),
  );

  let promoted = 0;
  let graduated = 0;

  await prisma.$transaction(async (tx) => {
    await tx.academicYear.update({
      where: { id: current.id },
      data: { isCurrent: false, closed: true, closedAt: new Date() },
    });
    await tx.academicYear.create({
      data: { year: newYear, isCurrent: true },
    });

    for (const { mapping, ids } of groups) {
      if (ids.length === 0) continue;
      if (mapping.graduate) {
        await tx.student.updateMany({
          where: { id: { in: ids } },
          data: { active: false, graduatedYear: current.year },
        });
        graduated += ids.length;
      } else if (mapping.target !== mapping.classRoom) {
        await tx.student.updateMany({
          where: { id: { in: ids } },
          data: { classRoom: mapping.target },
        });
        promoted += ids.length;
      } else {
        promoted += ids.length;
      }
    }

    // Fresh conduct scores for the new year (history keeps the old entries).
    await tx.student.updateMany({
      where: { active: true },
      data: { conductScore: 100 },
    });
  });

  await logAudit({
    userId: user.id,
    action: "CREATE",
    entityType: "AcademicYear",
    detail: `เปิดปีการศึกษา ${newYear} (ปิดปี ${current.year}) — เลื่อนชั้น ${promoted} คน, จบการศึกษา ${graduated} คน, รีเซ็ตคะแนนความประพฤติเป็น 100`,
  });

  revalidatePath("/admin/academic-year");
  revalidatePath("/dashboard");
  revalidatePath("/students");
  revalidatePath("/conduct/history");
  revalidatePath("/recycle/history");
  return {
    success: `เปิดปีการศึกษา ${newYear} เรียบร้อย — เลื่อนชั้น ${promoted} คน, จบการศึกษา ${graduated} คน`,
  };
}
