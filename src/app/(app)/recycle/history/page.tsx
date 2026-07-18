import { requireUser } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import Pagination, { parsePage } from "@/components/Pagination";
import CancelWasteButton from "@/components/recycle/CancelWasteButton";

const PAGE_SIZE = 25;

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function RecycleHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireUser();
  const canDelete = hasPermission(user, "DELETE_RECYCLE_HISTORY");
  const { page: pageParam } = await searchParams;

  const entriesTotal = await prisma.wasteScoreEntry.count();
  const page = parsePage(pageParam, Math.ceil(entriesTotal / PAGE_SIZE));

  const entries = await prisma.wasteScoreEntry.findMany({
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      wasteType: { select: { name: true, unit: true } },
      student: {
        select: { studentCode: true, firstName: true, lastName: true, classRoom: true },
      },
      recordedBy: { select: { fullName: true } },
      cancelledBy: { select: { fullName: true } },
    },
  });

  // Leaderboards and totals count only entries that are not cancelled.
  const [roomGroups, studentGroups, totalAgg] = await Promise.all([
    prisma.wasteScoreEntry.groupBy({
      by: ["classRoom"],
      where: { targetType: "ROOM", cancelledAt: null },
      _sum: { pointsAwarded: true },
    }),
    prisma.wasteScoreEntry.groupBy({
      by: ["studentId"],
      where: { targetType: "STUDENT", cancelledAt: null },
      _sum: { pointsAwarded: true },
    }),
    prisma.wasteScoreEntry.aggregate({
      where: { cancelledAt: null },
      _sum: { pointsAwarded: true },
    }),
  ]);

  const topRooms = roomGroups
    .filter((r) => r.classRoom)
    .map((r) => [r.classRoom as string, r._sum.pointsAwarded ?? 0] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const studentIds = studentGroups
    .filter((s) => s.studentId)
    .map((s) => s.studentId as string);
  const studentInfos = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true, classRoom: true },
  });
  const studentInfoMap = new Map(studentInfos.map((s) => [s.id, s]));

  const topStudents = studentGroups
    .filter((s) => s.studentId && studentInfoMap.has(s.studentId))
    .map((s) => {
      const info = studentInfoMap.get(s.studentId as string)!;
      return [
        s.studentId as string,
        {
          name: `${info.firstName} ${info.lastName}`,
          classRoom: info.classRoom,
          points: s._sum.pointsAwarded ?? 0,
        },
      ] as const;
    })
    .sort((a, b) => b[1].points - a[1].points)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="ประวัติและสรุปคะแนนขยะแลกแต้ม"
        description="ประวัติการบันทึกคะแนนและอันดับสะสมคะแนนรายห้อง/รายบุคคล"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            อันดับคะแนนรวมรายห้อง
          </h3>
          {topRooms.length === 0 ? (
            <p className="text-sm text-slate-400">ยังไม่มีข้อมูล</p>
          ) : (
            <ol className="space-y-2">
              {topRooms.map(([room, points], idx) => (
                <li
                  key={room}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <span>
                    {idx + 1}. {room}
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {points} คะแนน
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            อันดับคะแนนรวมรายบุคคล
          </h3>
          {topStudents.length === 0 ? (
            <p className="text-sm text-slate-400">ยังไม่มีข้อมูล</p>
          ) : (
            <ol className="space-y-2">
              {topStudents.map(([id, s], idx) => (
                <li
                  key={id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <span>
                    {idx + 1}. {s.name} ({s.classRoom})
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {s.points} คะแนน
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <StatCard
        label="คะแนนขยะแลกแต้มสะสมทั้งหมด"
        value={totalAgg._sum.pointsAwarded ?? 0}
        hint="คะแนน"
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">วันที่</th>
              <th className="px-4 py-3">เป้าหมาย</th>
              <th className="px-4 py-3">ประเภทขยะ</th>
              <th className="px-4 py-3">จำนวน</th>
              <th className="px-4 py-3">คะแนนที่ได้</th>
              <th className="px-4 py-3">ผู้บันทึก</th>
              {canDelete && <th className="px-4 py-3 text-right">จัดการ</th>}
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const cancelled = e.cancelledAt !== null;
              return (
                <tr
                  key={e.id}
                  className={`border-b border-slate-100 last:border-0 ${
                    cancelled ? "opacity-60" : ""
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {formatDateTime(e.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {e.targetType === "ROOM"
                      ? `ห้อง ${e.classRoom}`
                      : e.student
                        ? `${e.student.studentCode} ${e.student.firstName} ${e.student.lastName}`
                        : "-"}
                    {cancelled && (
                      <span className="mt-0.5 block text-xs text-red-500">
                        ยกเลิกแล้ว
                        {e.cancelledBy ? ` โดย ${e.cancelledBy.fullName}` : ""}
                        {e.cancelReason ? `: ${e.cancelReason}` : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {e.wasteType.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {e.quantity} {e.wasteType.unit}
                  </td>
                  <td
                    className={`px-4 py-3 font-semibold ${
                      cancelled
                        ? "text-slate-400 line-through"
                        : "text-emerald-700"
                    }`}
                  >
                    {e.pointsAwarded}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {e.recordedBy?.fullName ?? "—"}
                  </td>
                  {canDelete && (
                    <td className="px-4 py-3 text-right">
                      {cancelled ? (
                        <span className="text-xs text-slate-400">
                          ยกเลิกแล้ว
                        </span>
                      ) : (
                        <CancelWasteButton
                          id={e.id}
                          label={`${e.wasteType.name} ${e.pointsAwarded} คะแนน`}
                        />
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {entries.length === 0 && (
              <tr>
                <td colSpan={canDelete ? 7 : 6} className="px-4 py-2">
                  <EmptyState
                    title="ยังไม่มีประวัติการบันทึกคะแนน"
                    description="เริ่มบันทึกคะแนนได้ที่หน้า “ขยะแลกแต้ม”"
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={entriesTotal} />
    </div>
  );
}
