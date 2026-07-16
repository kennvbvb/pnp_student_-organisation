import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import PositionManager from "@/components/structure/PositionManager";

export default async function StructureManagePage() {
  await requirePermission("MANAGE_STRUCTURE");

  const positions = await prisma.councilPosition.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      title: true,
      parentId: true,
      holderName: true,
      sortOrder: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="จัดการโครงสร้างสภานักเรียน"
        description="เพิ่ม แก้ไข หรือลบตำแหน่งในโครงสร้างสภานักเรียนได้อย่างอิสระ"
      />
      <PositionManager positions={positions} />
    </div>
  );
}
