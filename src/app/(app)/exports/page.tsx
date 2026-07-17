import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import ExportPanel from "@/components/exports/ExportPanel";

export default async function ExportsPage() {
  await requirePermission("EXPORT_DATA");

  const [students, classRoomRows] = await Promise.all([
    prisma.student.findMany({
      where: { active: true },
      orderBy: [{ classRoom: "asc" }, { studentCode: "asc" }],
      select: {
        id: true,
        studentCode: true,
        firstName: true,
        lastName: true,
        classRoom: true,
      },
    }),
    prisma.student.findMany({
      where: { active: true },
      distinct: ["classRoom"],
      select: { classRoom: true },
      orderBy: { classRoom: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="ส่งออกข้อมูล (Export)"
        description="ดาวน์โหลดข้อมูลคะแนนความประพฤติและขยะแลกแต้มเป็นไฟล์ Excel"
      />
      <ExportPanel
        students={students}
        classRooms={classRoomRows.map((c) => c.classRoom)}
      />
    </div>
  );
}
