import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function ConductHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission("VIEW_CONDUCT_HISTORY");
  const { q = "" } = await searchParams;

  const deductions = await prisma.conductDeduction.findMany({
    where: q
      ? {
          student: {
            OR: [
              { studentCode: { contains: q } },
              { firstName: { contains: q } },
              { lastName: { contains: q } },
            ],
          },
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      student: {
        select: {
          studentCode: true,
          firstName: true,
          lastName: true,
          classRoom: true,
        },
      },
      recordedBy: { select: { fullName: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="ประวัติการลดคะแนนความประพฤติ"
        description="รายการบันทึกการลดคะแนนความประพฤติของนักเรียนทั้งหมด"
      />

      <form className="mb-4 flex gap-3" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="ค้นหารหัสนักเรียน หรือชื่อ"
          className="w-80 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          ค้นหา
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">วันที่</th>
              <th className="px-4 py-3">นักเรียน</th>
              <th className="px-4 py-3">ห้อง</th>
              <th className="px-4 py-3">คะแนนที่ลด</th>
              <th className="px-4 py-3">หมวดหมู่</th>
              <th className="px-4 py-3">เหตุผล</th>
              <th className="px-4 py-3">ผู้บันทึก</th>
            </tr>
          </thead>
          <tbody>
            {deductions.map((d) => (
              <tr key={d.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                  {formatDateTime(d.createdAt)}
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">
                  {d.student.studentCode} {d.student.firstName}{" "}
                  {d.student.lastName}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {d.student.classRoom}
                </td>
                <td className="px-4 py-3 font-semibold text-red-600">
                  -{d.amount}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {d.category ?? "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">{d.reason}</td>
                <td className="px-4 py-3 text-slate-500">
                  {d.recordedBy.fullName}
                </td>
              </tr>
            ))}
            {deductions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  ยังไม่มีประวัติการลดคะแนน
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
