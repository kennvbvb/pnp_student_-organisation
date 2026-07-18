import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import StudentManager from "@/components/students/StudentManager";
import Pagination, { parsePage } from "@/components/Pagination";

const PAGE_SIZE = 25;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; classRoom?: string; page?: string }>;
}) {
  const user = await requireUser();
  const canManage = hasPermission(user, "MANAGE_STUDENTS");
  const { q = "", classRoom = "", page: pageParam } = await searchParams;

  const where = {
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
  };

  const total = await prisma.student.count({ where });
  const page = parsePage(pageParam, Math.ceil(total / PAGE_SIZE));

  const [students, classRooms] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: [{ classRoom: "asc" }, { studentCode: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
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
          aria-label="ค้นหาชื่อ หรือรหัสนักเรียน"
          placeholder="ค้นหาชื่อ หรือรหัสนักเรียน"
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-800"
        />
        <select
          name="classRoom"
          defaultValue={classRoom}
          aria-label="กรองตามห้อง"
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

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        params={{ q, classRoom }}
      />
    </div>
  );
}
