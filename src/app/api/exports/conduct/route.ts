import { getCurrentUser, hasPermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { xlsxResponse, formatThaiDateTime } from "@/lib/xlsx";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "EXPORT_DATA")) {
    return new Response("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "all";
  const classRoom = searchParams.get("classRoom") ?? "";
  const studentId = searchParams.get("studentId") ?? "";

  if (scope === "student") {
    if (!studentId) {
      return new Response("studentId required", { status: 400 });
    }
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        conductDeductions: {
          orderBy: { createdAt: "desc" },
          include: { recordedBy: { select: { fullName: true } } },
        },
      },
    });
    if (!student) return new Response("Not found", { status: 404 });

    const summary: (string | number | null)[][] = [
      ["รหัสนักเรียน", student.studentCode],
      ["ชื่อ-นามสกุล", `${student.prefix ?? ""}${student.firstName} ${student.lastName}`],
      ["ห้อง", student.classRoom],
      ["คะแนนความประพฤติปัจจุบัน", student.conductScore],
    ];
    const history: (string | number | null)[][] = [
      ["วันที่", "ประเภท", "คะแนน", "เหตุผล", "หมวดหมู่", "ผู้บันทึก"],
      ...student.conductDeductions.map((c) => [
        formatThaiDateTime(c.createdAt),
        c.type === "ADD" ? "เพิ่ม" : "ลด",
        c.type === "ADD" ? c.amount : -c.amount,
        c.reason,
        c.category ?? "",
        c.recordedBy?.fullName ?? "—",
      ]),
    ];

    return xlsxResponse(
      [
        { name: "ข้อมูลนักเรียน", rows: summary, cols: [26, 30] },
        { name: "ประวัติคะแนน", rows: history, cols: [20, 8, 8, 30, 14, 18] },
      ],
      `conduct_${student.studentCode}.xlsx`,
    );
  }

  // scope: all | room -> list of students with current conduct score
  const students = await prisma.student.findMany({
    where: {
      active: true,
      ...(scope === "room" && classRoom ? { classRoom } : {}),
    },
    orderBy: [{ classRoom: "asc" }, { studentCode: "asc" }],
  });

  const rows: (string | number | null)[][] = [
    ["รหัสนักเรียน", "คำนำหน้า", "ชื่อ", "นามสกุล", "ห้อง", "คะแนนความประพฤติ"],
    ...students.map((s) => [
      s.studentCode,
      s.prefix ?? "",
      s.firstName,
      s.lastName,
      s.classRoom,
      s.conductScore,
    ]),
  ];

  const filename =
    scope === "room" && classRoom
      ? `conduct_room_${classRoom}.xlsx`
      : "conduct_all.xlsx";

  return xlsxResponse(
    [{ name: "คะแนนความประพฤติ", rows, cols: [14, 10, 16, 16, 10, 14] }],
    filename,
  );
}
