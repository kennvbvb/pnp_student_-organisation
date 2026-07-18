import { requirePermission } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import Pagination, { parsePage } from "@/components/Pagination";
import DeleteConductButton from "@/components/conduct/DeleteConductButton";

const PAGE_SIZE = 25;

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function ConductHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requirePermission("VIEW_CONDUCT_HISTORY");
  const canDelete = hasPermission(user, "DELETE_CONDUCT_HISTORY");
  const { q = "", page: pageParam } = await searchParams;

  const where = q
    ? {
        student: {
          OR: [
            { studentCode: { contains: q } },
            { firstName: { contains: q } },
            { lastName: { contains: q } },
          ],
        },
      }
    : undefined;

  const total = await prisma.conductDeduction.count({ where });
  const page = parsePage(pageParam, Math.ceil(total / PAGE_SIZE));

  const entries = await prisma.conductDeduction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
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
        title="ประวัติคะแนนความประพฤติ"
        description="รายการบันทึกการเพิ่มและลดคะแนนความประพฤติของนักเรียน"
      />

      <form className="mb-4 flex gap-3" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          aria-label="ค้นหารหัสนักเรียน หรือชื่อ"
          placeholder="ค้นหารหัสนักเรียน หรือชื่อ"
          className="w-80 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
        />
        <button
          type="submit"
          className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          ค้นหา
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">วันที่</th>
              <th className="px-4 py-3">นักเรียน</th>
              <th className="px-4 py-3">ห้อง</th>
              <th className="px-4 py-3">ประเภท</th>
              <th className="px-4 py-3">คะแนน</th>
              <th className="px-4 py-3">เหตุผล</th>
              <th className="px-4 py-3">ผู้บันทึก</th>
              {canDelete && <th className="px-4 py-3 text-right">จัดการ</th>}
            </tr>
          </thead>
          <tbody>
            {entries.map((d) => {
              const isAdd = d.type === "ADD";
              return (
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
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        isAdd
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {isAdd ? "เพิ่ม" : "ลด"}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 font-semibold ${
                      isAdd ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {isAdd ? "+" : "-"}
                    {d.amount}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{d.reason}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {d.recordedBy?.fullName ?? "—"}
                  </td>
                  {canDelete && (
                    <td className="px-4 py-3 text-right">
                      <DeleteConductButton
                        id={d.id}
                        label={`${d.student.firstName} ${d.student.lastName}`}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
            {entries.length === 0 && (
              <tr>
                <td
                  colSpan={canDelete ? 8 : 7}
                  className="px-4 py-2"
                >
                  <EmptyState
                    title="ยังไม่มีประวัติคะแนนความประพฤติ"
                    description="เมื่อมีการเพิ่มหรือลดคะแนน รายการจะแสดงที่นี่"
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} params={{ q }} />
    </div>
  );
}
