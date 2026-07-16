import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import RecordScoreForm from "@/components/recycle/RecordScoreForm";
import WasteTypeManager from "@/components/recycle/WasteTypeManager";

export default async function RecyclePage() {
  await requirePermission("MANAGE_RECYCLE");

  const [wasteTypes, students, classRoomRows] = await Promise.all([
    prisma.wasteType.findMany({ orderBy: { name: "asc" } }),
    prisma.student.findMany({
      where: { active: true },
      orderBy: [{ classRoom: "asc" }, { studentCode: "asc" }],
      select: { id: true, studentCode: true, firstName: true, lastName: true, classRoom: true },
    }),
    prisma.student.findMany({
      distinct: ["classRoom"],
      select: { classRoom: true },
      orderBy: { classRoom: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="กิจกรรมขยะแลกแต้ม"
        description="บันทึกคะแนนกิจกรรมขยะแลกแต้มเป็นรายห้องหรือรายบุคคล"
      />

      <WasteTypeManager wasteTypes={wasteTypes} />

      <RecordScoreForm
        wasteTypes={wasteTypes}
        students={students}
        classRooms={classRoomRows.map((c) => c.classRoom)}
      />
    </div>
  );
}
