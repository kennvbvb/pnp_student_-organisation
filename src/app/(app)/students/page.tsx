import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import StudentManager from "@/components/students/StudentManager";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; classRoom?: string }>;
}) {
  const user = await requireUser();
  const canManage = hasPermission(user, "MANAGE_STUDENTS");
  const { q = "", classRoom = "" } = await searchParams;

  const [students, classRooms] = await Promise.all([
    prisma.student.findMany({
      where: {
        AND: [
          classRoom ? { classRoom } : {},
          q
            ? {
                OR: [
                  { studentCode: { contains: q } },
                  { firstName: { contains: q } },
                  { lastName: { contains: q } },
                ],
              }
            : {},
        ],
      },
      orderBy: [{ classRoom: "asc" }, { studentCode: "asc" }],
      select: {
        id: true,
        studentCode: true,
        prefix: true,
        firstName: true,
        lastName: true,
        classRoom: true,
        conductScore: true,
        active: true,
      },
    }),
    prisma.student.findMany({
      distinct: ["classRoom"],
      select: { classRoom: true },
      orderBy: { classRoom: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="รายชื่อนักเรียน"
        description="ค้นหาและจัดการข้อมูลนักเรียนในระบบ"
        action={
          canManage ? (
            <Link
              href="/students/import"
              className="rounded-lg border border-blue-900 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50"
            >
              นำเข้าข้อมูลจาก Excel
            </Link>
          ) : undefined
        }
      />

      <form className="mb-4 flex flex-wrap gap-3" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="ค้นหาชื่อ หรือรหัสนักเรียน"
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-800"
        />
        <select
          name="classRoom"
          defaultValue={classRoom}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-800"
        >
          <option value="">ทุกห้อง</option>
          {classRooms.map((c) => (
            <option key={c.classRoom} value={c.classRoom}>
              {c.classRoom}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          ค้นหา
        </button>
      </form>

      <StudentManager students={students} canManage={canManage} />
    </div>
  );
}
