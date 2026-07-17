import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import PositionManager from "@/components/structure/PositionManager";

export default async function StructureManagePage() {
  await requirePermission("MANAGE_STRUCTURE");

  const [positions, students, classRoomRows] = await Promise.all([
    prisma.councilPosition.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        parentId: true,
        holderName: true,
        holderStudentId: true,
        sortOrder: true,
      },
    }),
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
        title="จัดการโครงสร้างสภานักเรียน"
        description="เพิ่ม แก้ไข หรือลบตำแหน่งในโครงสร้างสภานักเรียนได้อย่างอิสระ"
      />
      <PositionManager
        positions={positions}
        students={students}
        classRooms={classRoomRows.map((c) => c.classRoom)}
      />
    </div>
  );
}
