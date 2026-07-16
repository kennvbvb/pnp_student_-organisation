import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import ConductForm from "@/components/conduct/ConductForm";
import ReasonManager from "@/components/conduct/ReasonManager";

export default async function ConductPage() {
  await requirePermission("MANAGE_CONDUCT");

  const [students, classRoomRows, reasons] = await Promise.all([
    prisma.student.findMany({
      where: { active: true },
      orderBy: [{ classRoom: "asc" }, { studentCode: "asc" }],
      select: {
        id: true,
        studentCode: true,
        prefix: true,
        firstName: true,
        lastName: true,
        classRoom: true,
        conductScore: true,
      },
    }),
    prisma.student.findMany({
      where: { active: true },
      distinct: ["classRoom"],
      select: { classRoom: true },
      orderBy: { classRoom: "asc" },
    }),
    prisma.conductReason.findMany({
      where: { active: true },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
      select: { id: true, text: true, type: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="บันทึกคะแนนความประพฤติ"
        description="เลือกห้อง → เลือกนักเรียน แล้วเพิ่มหรือลดคะแนนพร้อมระบุเหตุผล"
      />

      <ConductForm
        students={students}
        classRooms={classRoomRows.map((c) => c.classRoom)}
        reasons={reasons}
      />

      <ReasonManager reasons={reasons} />
    </div>
  );
}
