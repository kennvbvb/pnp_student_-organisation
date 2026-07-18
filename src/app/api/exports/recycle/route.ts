import { getCurrentUser, hasPermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { xlsxResponse, formatThaiDateTime } from "@/lib/xlsx";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "EXPORT_DATA")) {
    return new Response("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "room";
  const classRoom = searchParams.get("classRoom") ?? "";
  const studentId = searchParams.get("studentId") ?? "";

  if (scope === "student") {
    if (!studentId) return new Response("studentId required", { status: 400 });
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) return new Response("Not found", { status: 404 });

    const entries = await prisma.wasteScoreEntry.findMany({
      where: { targetType: "STUDENT", studentId, cancelledAt: null },
      orderBy: { createdAt: "desc" },
      include: { wasteType: { select: { name: true, unit: true } } },
    });
    const total = entries.reduce((sum, e) => sum + e.pointsAwarded, 0);

    // Personal data leaves the system — record who exported what.
    await logAudit({
      userId: user.id,
      action: "EXPORT",
      entityType: "WasteScoreEntry",
      entityId: student.id,
      detail: `ส่งออกคะแนนขยะแลกแต้มรายบุคคล: ${student.studentCode} ${student.firstName} ${student.lastName}`,
    });

    const rows: (string | number | null)[][] = [
      ["วันที่", "ประเภทขยะ", "จำนวน", "หน่วย", "คะแนน", "หมายเหตุ"],
      ...entries.map((e) => [
        formatThaiDateTime(e.createdAt),
        e.wasteType.name,
        e.quantity,
        e.wasteType.unit,
        e.pointsAwarded,
        e.note ?? "",
      ]),
      [],
      ["รวมคะแนนทั้งหมด", "", "", "", total, ""],
    ];

    return xlsxResponse(
      [
        {
          name: `${student.firstName}`.slice(0, 20),
          rows,
          cols: [20, 16, 8, 10, 8, 20],
        },
      ],
      `recycle_student_${student.studentCode}.xlsx`,
    );
  }

  // scope: room
  if (!classRoom) return new Response("classRoom required", { status: 400 });
  const entries = await prisma.wasteScoreEntry.findMany({
    where: { targetType: "ROOM", classRoom, cancelledAt: null },
    orderBy: { createdAt: "desc" },
    include: { wasteType: { select: { name: true, unit: true } } },
  });
  const total = entries.reduce((sum, e) => sum + e.pointsAwarded, 0);

  await logAudit({
    userId: user.id,
    action: "EXPORT",
    entityType: "WasteScoreEntry",
    detail: `ส่งออกคะแนนขยะแลกแต้มรายห้อง: ${classRoom} (${entries.length} รายการ)`,
  });

  const rows: (string | number | null)[][] = [
    ["วันที่", "ประเภทขยะ", "จำนวน", "หน่วย", "คะแนน", "หมายเหตุ"],
    ...entries.map((e) => [
      formatThaiDateTime(e.createdAt),
      e.wasteType.name,
      e.quantity,
      e.wasteType.unit,
      e.pointsAwarded,
      e.note ?? "",
    ]),
    [],
    ["รวมคะแนนทั้งหมด", "", "", "", total, ""],
  ];

  return xlsxResponse(
    [{ name: `ห้อง ${classRoom}`, rows, cols: [20, 16, 8, 10, 8, 20] }],
    `recycle_room_${classRoom}.xlsx`,
  );
}
