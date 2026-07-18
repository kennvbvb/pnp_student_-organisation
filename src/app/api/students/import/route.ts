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

export type PreviewRowStatus = "create" | "update" | "unchanged" | "error";

export type PreviewRow = {
  rowNum: number;
  studentCode: string;
  prefix: string | null;
  firstName: string;
  lastName: string;
  classRoom: string;
  status: PreviewRowStatus;
  error?: string;
};

/** Parse the uploaded workbook and classify every row without writing anything. */
async function parseAndClassify(file: File): Promise<PreviewRow[] | null> {
  const arrayBuffer = await file.arrayBuffer();
  let rows: ImportRow[];
  try {
    const workbook = XLSX.read(arrayBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: "" });
  } catch {
    return null;
  }

  const seenCodes = new Map<string, number>(); // code -> first rowNum
  const result: PreviewRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // header is row 1
    const row = rows[i];
    const studentCode = String(row["รหัสนักเรียน"] ?? "").trim();
    const prefix = String(row["คำนำหน้า"] ?? "").trim() || null;
    const firstName = String(row["ชื่อ"] ?? "").trim();
    const lastName = String(row["นามสกุล"] ?? "").trim();
    const classRoom = String(row["ห้อง"] ?? "").trim();

    const base = { rowNum, studentCode, prefix, firstName, lastName, classRoom };

    if (!studentCode || !firstName || !lastName || !classRoom) {
      result.push({
        ...base,
        status: "error",
        error: "ข้อมูลไม่ครบถ้วน (ต้องมีรหัสนักเรียน ชื่อ นามสกุล และห้อง)",
      });
      continue;
    }

    const dupRow = seenCodes.get(studentCode);
    if (dupRow !== undefined) {
      result.push({
        ...base,
        status: "error",
        error: `รหัสนักเรียนซ้ำกับแถวที่ ${dupRow} ในไฟล์เดียวกัน`,
      });
      continue;
    }
    seenCodes.set(studentCode, rowNum);

    const existing = await prisma.student.findUnique({
      where: { studentCode },
    });
    if (!existing) {
      result.push({ ...base, status: "create" });
    } else if (
      (existing.prefix ?? "") === (prefix ?? "") &&
      existing.firstName === firstName &&
      existing.lastName === lastName &&
      existing.classRoom === classRoom
    ) {
      result.push({ ...base, status: "unchanged" });
    } else {
      result.push({ ...base, status: "update" });
    }
  }

  return result;
}

function summarize(rows: PreviewRow[]) {
  return {
    create: rows.filter((r) => r.status === "create").length,
    update: rows.filter((r) => r.status === "update").length,
    unchanged: rows.filter((r) => r.status === "unchanged").length,
    error: rows.filter((r) => r.status === "error").length,
  };
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "MANAGE_STUDENTS")) {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const mode = String(formData.get("mode") ?? "preview");

  if (!(file instanceof File)) {
    return Response.json({ error: "กรุณาแนบไฟล์ Excel" }, { status: 400 });
  }

  const rows = await parseAndClassify(file);
  if (rows === null) {
    return Response.json(
      { error: "ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์" },
      { status: 400 },
    );
  }

  // Preview: report what WOULD happen — nothing is written.
  if (mode !== "commit") {
    return Response.json({ mode: "preview", rows, summary: summarize(rows) });
  }

  // Commit: apply all valid rows in one transaction (all-or-nothing).
  const toApply = rows.filter(
    (r) => r.status === "create" || r.status === "update",
  );
  try {
    await prisma.$transaction(
      toApply.map((r) =>
        prisma.student.upsert({
          where: { studentCode: r.studentCode },
          create: {
            studentCode: r.studentCode,
            prefix: r.prefix,
            firstName: r.firstName,
            lastName: r.lastName,
            classRoom: r.classRoom,
          },
          update: {
            prefix: r.prefix,
            firstName: r.firstName,
            lastName: r.lastName,
            classRoom: r.classRoom,
          },
        }),
      ),
    );
  } catch {
    return Response.json(
      { error: "นำเข้าไม่สำเร็จ ระบบยกเลิกการเปลี่ยนแปลงทั้งหมดแล้ว กรุณาลองใหม่" },
      { status: 500 },
    );
  }

  const summary = summarize(rows);
  await logAudit({
    userId: user.id,
    action: "IMPORT",
    entityType: "Student",
    detail: `นำเข้าไฟล์ Excel: สร้างใหม่ ${summary.create}, อัปเดต ${summary.update}, ไม่เปลี่ยนแปลง ${summary.unchanged}, ผิดพลาด ${summary.error}`,
  });

  return Response.json({ mode: "commit", rows, summary });
}
