import * as XLSX from "xlsx";
import { getCurrentUser, hasPermission } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "MANAGE_STUDENTS")) {
    return new Response("Forbidden", { status: 403 });
  }

  const headerRow = ["รหัสนักเรียน", "คำนำหน้า", "ชื่อ", "นามสกุล", "ห้อง"];
  const sampleRows = [
    ["12345", "เด็กชาย", "สมชาย", "ใจดี", "ม.1/1"],
    ["12346", "เด็กหญิง", "สมหญิง", "ใจงาม", "ม.1/1"],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...sampleRows]);
  worksheet["!cols"] = [
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 16 },
    { wch: 10 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "รายชื่อนักเรียน");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="student_import_template.xlsx"',
    },
  });
}
