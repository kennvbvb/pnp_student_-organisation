import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import ConductStudentList from "@/components/conduct/ConductForm";

export default async function ConductPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission("MANAGE_CONDUCT");
  const { q = "" } = await searchParams;

  const students = q
    ? await prisma.student.findMany({
        where: {
          active: true,
          OR: [
            { studentCode: { contains: q } },
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { classRoom: { contains: q } },
          ],
        },
        orderBy: [{ classRoom: "asc" }, { studentCode: "asc" }],
        take: 50,
        select: {
          id: true,
          studentCode: true,
          prefix: true,
          firstName: true,
          lastName: true,
          classRoom: true,
          conductScore: true,
        },
      })
    : [];

  return (
    <div>
      <PageHeader
        title="บันทึกคะแนนความประพฤติ"
        description="ค้นหานักเรียนด้วยรหัส ชื่อ หรือห้องเรียน เพื่อบันทึกการลดคะแนน"
      />

      <form className="mb-4 flex gap-3" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="ค้นหารหัสนักเรียน ชื่อ หรือห้อง"
          className="w-80 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          ค้นหา
        </button>
      </form>

      <ConductStudentList students={students} />
    </div>
  );
}
