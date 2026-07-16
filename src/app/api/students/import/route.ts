import * as XLSX from "xlsx";
import { getCurrentUser, hasPermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

type ImportRow = {
  รหัสนักเรียน?: unknown;
  คำนำหน้า?: unknown;
  ชื่อ?: unknown;
  นามสกุล?: unknown;
  ห้อง?: unknown;
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "MANAGE_STUDENTS")) {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "กรุณาแนบไฟล์ Excel" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  let rows: ImportRow[];
  try {
    const workbook = XLSX.read(arrayBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: "" });
  } catch {
    return Response.json(
      { error: "ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์" },
      { status: 400 },
    );
  }

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // header is row 1
    const row = rows[i];
    const studentCode = String(row["รหัสนักเรียน"] ?? "").trim();
    const prefix = String(row["คำนำหน้า"] ?? "").trim();
    const firstName = String(row["ชื่อ"] ?? "").trim();
    const lastName = String(row["นามสกุล"] ?? "").trim();
    const classRoom = String(row["ห้อง"] ?? "").trim();

    if (!studentCode || !firstName || !lastName || !classRoom) {
      errors.push(`แถวที่ ${rowNum}: ข้อมูลไม่ครบถ้วน (ต้องมีรหัสนักเรียน ชื่อ นามสกุล และห้อง)`);
      continue;
    }

    const existing = await prisma.student.findUnique({
      where: { studentCode },
    });

    if (existing) {
      await prisma.student.update({
        where: { studentCode },
        data: { prefix: prefix || null, firstName, lastName, classRoom },
      });
      updated++;
    } else {
      await prisma.student.create({
        data: {
          studentCode,
          prefix: prefix || null,
          firstName,
          lastName,
          classRoom,
        },
      });
      created++;
    }
  }

  await logAudit({
    userId: user.id,
    action: "IMPORT",
    entityType: "Student",
    detail: `นำเข้าไฟล์ Excel: สร้างใหม่ ${created}, อัปเดต ${updated}, ผิดพลาด ${errors.length}`,
  });

  return Response.json({ created, updated, errors });
}
