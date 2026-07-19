import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { classifyLevel } from "@/lib/level";
import { getCurrentAcademicYear } from "@/lib/academic-year";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import AlertBanner from "@/components/AlertBanner";
import {
  ConductTrendChart,
  RecycleBarChart,
} from "@/components/dashboard/DashboardCharts";
import {
  StudentsIcon,
  StructureIcon,
  ConductIcon,
  RecycleIcon,
  BellIcon,
} from "@/components/icons";

const UPCOMING_WINDOW_DAYS = 7;
const NOTIFY_WINDOW_DAYS = 7;
// Keep dashboard lists short — full data lives on the dedicated pages.
const PRIMARY_PREVIEW_ROWS = 5;

function formatThaiDate(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function DashboardPage() {
  const user = await requireUser();
  const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";

  const academicYear = await getCurrentAcademicYear();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const upcomingUntil = new Date(now);
  upcomingUntil.setDate(upcomingUntil.getDate() + UPCOMING_WINDOW_DAYS);
  const notifySince = new Date(now);
  notifySince.setDate(notifySince.getDate() - NOTIFY_WINDOW_DAYS);

  const [
    studentCount,
    positionCount,
    conductThisMonth,
    wasteThisMonth,
    upcomingActivities,
    students,
    roomRecycleGroups,
    studentRecycleGroups,
    recentConduct,
    recentRecycle,
  ] = await Promise.all([
    prisma.student.count({ where: { active: true } }),
    prisma.councilPosition.count(),
    prisma.conductDeduction.aggregate({
      _count: true,
      where: {
        createdAt: { gte: startOfMonth },
        type: "DEDUCT",
        cancelledAt: null,
      },
    }),
    prisma.wasteScoreEntry.aggregate({
      _sum: { pointsAwarded: true },
      where: { createdAt: { gte: startOfMonth }, cancelledAt: null },
    }),
    prisma.planActivity.findMany({
      where: { startDate: { gte: now, lte: upcomingUntil } },
      orderBy: { startDate: "asc" },
      take: 5,
    }),
    prisma.student.findMany({
      where: { active: true },
      select: {
        id: true,
        studentCode: true,
        prefix: true,
        firstName: true,
        lastName: true,
        classRoom: true,
        conductScore: true,
      },
      orderBy: [{ classRoom: "asc" }, { studentCode: "asc" }],
    }),
    prisma.wasteScoreEntry.groupBy({
      by: ["classRoom"],
      where: {
        targetType: "ROOM",
        cancelledAt: null,
        academicYearId: academicYear.id,
      },
      _sum: { pointsAwarded: true },
    }),
    prisma.wasteScoreEntry.groupBy({
      by: ["studentId"],
      where: {
        targetType: "STUDENT",
        cancelledAt: null,
        academicYearId: academicYear.id,
      },
      _sum: { pointsAwarded: true },
    }),
    prisma.conductDeduction.findMany({
      where: { createdAt: { gte: notifySince }, cancelledAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        student: { select: { firstName: true, lastName: true, classRoom: true } },
      },
    }),
    prisma.wasteScoreEntry.findMany({
      where: { createdAt: { gte: notifySince }, cancelledAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        wasteType: { select: { name: true } },
        student: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  // Recycle lookup maps
  const roomRecycle = new Map<string, number>();
  for (const g of roomRecycleGroups) {
    if (g.classRoom) roomRecycle.set(g.classRoom, g._sum.pointsAwarded ?? 0);
  }
  const studentRecycle = new Map<string, number>();
  for (const g of studentRecycleGroups) {
    if (g.studentId) studentRecycle.set(g.studentId, g._sum.pointsAwarded ?? 0);
  }

  // Feature 5: kindergarten — aggregate per room
  const kinderRooms = new Map<
    string,
    { conductTotal: number; count: number }
  >();
  // Feature 6: primary — per individual
  const primaryStudents = students.filter(
    (s) => classifyLevel(s.classRoom) === "primary",
  );
  const primaryPreview = primaryStudents.slice(0, PRIMARY_PREVIEW_ROWS);
  for (const s of students) {
    if (classifyLevel(s.classRoom) !== "kindergarten") continue;
    const cur = kinderRooms.get(s.classRoom) ?? { conductTotal: 0, count: 0 };
    cur.conductTotal += s.conductScore;
    cur.count += 1;
    kinderRooms.set(s.classRoom, cur);
  }
  const kinderRoomRows = [...kinderRooms.entries()].sort((a, b) =>
    a[0].localeCompare(b[0], "th"),
  );

  // --- Chart data ---
  // Monthly conduct trend over the last 12 months (add vs deduct counts).
  const trendStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const conductForTrend = await prisma.conductDeduction.findMany({
    where: { createdAt: { gte: trendStart }, cancelledAt: null },
    select: { createdAt: true, type: true },
  });
  const THAI_MONTHS = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];
  const trendBuckets: { key: string; label: string; add: number; deduct: number }[] =
    [];
  const bucketIndex = new Map<string, number>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    bucketIndex.set(key, trendBuckets.length);
    trendBuckets.push({ key, label: THAI_MONTHS[d.getMonth()], add: 0, deduct: 0 });
  }
  for (const c of conductForTrend) {
    const key = `${c.createdAt.getFullYear()}-${c.createdAt.getMonth()}`;
    const idx = bucketIndex.get(key);
    if (idx === undefined) continue;
    if (c.type === "ADD") trendBuckets[idx].add += 1;
    else trendBuckets[idx].deduct += 1;
  }
  const trendData = trendBuckets.map((b) => ({
    label: b.label,
    add: b.add,
    deduct: b.deduct,
  }));

  // Per-room recycle points (current year), top 8.
  const recycleBarData = [...roomRecycle.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`สวัสดี, ${user.fullName}`}
        description="ภาพรวมระบบสภานักเรียนโรงเรียนวัดพนมพริก"
      />

      {upcomingActivities.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
            <BellIcon className="h-4 w-4 text-amber-500" />
            กิจกรรมที่ใกล้ถึง
          </div>
          <div className="space-y-2">
            {upcomingActivities.map((activity) => {
              const daysLeft = Math.ceil(
                (activity.startDate.getTime() - now.getTime()) /
                  (1000 * 60 * 60 * 24),
              );
              return (
                <AlertBanner key={activity.id} variant="warning">
                  ใกล้ถึงกิจกรรม <strong>{activity.title}</strong> ในวันที่{" "}
                  {formatThaiDate(activity.startDate)}{" "}
                  {daysLeft <= 0 ? "(วันนี้)" : `(อีก ${daysLeft} วัน)`}
                </AlertBanner>
              );
            })}
          </div>
        </div>
      )}

      {/* Feature 7: admin notifications */}
      {isAdmin && (
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
            <BellIcon className="h-4 w-4 text-blue-800" />
            การแจ้งเตือนสำหรับผู้ดูแลระบบ
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  คะแนนความประพฤติล่าสุด ({NOTIFY_WINDOW_DAYS} วัน)
                </p>
                <Link
                  href="/conduct/history"
                  className="text-xs font-medium text-blue-800 hover:underline"
                >
                  ดูทั้งหมด →
                </Link>
              </div>
              {recentConduct.length === 0 ? (
                <p className="text-sm text-slate-400">ไม่มีรายการ</p>
              ) : (
                <ul className="space-y-2">
                  {recentConduct.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="text-slate-700">
                        {c.student.firstName} {c.student.lastName}{" "}
                        <span className="text-xs text-slate-400">
                          ({c.student.classRoom})
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${c.type === "ADD" ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {c.type === "ADD" ? "+" : "-"}
                          {c.amount}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDateTime(c.createdAt)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  กิจกรรมขยะแลกแต้มล่าสุด ({NOTIFY_WINDOW_DAYS} วัน)
                </p>
                <Link
                  href="/recycle/history"
                  className="text-xs font-medium text-blue-800 hover:underline"
                >
                  ดูทั้งหมด →
                </Link>
              </div>
              {recentRecycle.length === 0 ? (
                <p className="text-sm text-slate-400">ไม่มีรายการ</p>
              ) : (
                <ul className="space-y-2">
                  {recentRecycle.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="text-slate-700">
                        {r.targetType === "ROOM"
                          ? `ห้อง ${r.classRoom}`
                          : r.student
                            ? `${r.student.firstName} ${r.student.lastName}`
                            : "—"}{" "}
                        <span className="text-xs text-slate-400">
                          ({r.wasteType.name})
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-600">
                          +{r.pointsAwarded}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDateTime(r.createdAt)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="นักเรียนในระบบ"
          value={studentCount}
          hint="คน"
          icon={StudentsIcon}
          accent="sky"
        />
        <StatCard
          label="ตำแหน่งในโครงสร้างสภา"
          value={positionCount}
          hint="ตำแหน่ง"
          icon={StructureIcon}
          accent="violet"
        />
        <StatCard
          label="การลดคะแนนความประพฤติเดือนนี้"
          value={conductThisMonth._count}
          hint="ครั้ง"
          icon={ConductIcon}
          accent="rose"
        />
        <StatCard
          label="คะแนนขยะแลกแต้มเดือนนี้"
          value={wasteThisMonth._sum.pointsAwarded ?? 0}
          hint="คะแนนสะสม"
          icon={RecycleIcon}
          accent="emerald"
        />
      </div>

      {/* Charts: monthly conduct trend + per-room recycle bars */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ConductTrendChart data={trendData} />
        <RecycleBarChart data={recycleBarData} />
      </div>

      {/* Feature 5: kindergarten per room */}
      <div>
        <h2 className="mb-3 text-base font-bold text-slate-800">
          ระดับอนุบาล — คะแนนรวมรายห้อง
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">ห้อง</th>
                <th className="px-4 py-3">จำนวนนักเรียน</th>
                <th className="px-4 py-3">คะแนนความประพฤติรวม</th>
                <th className="px-4 py-3">คะแนนขยะแลกแต้มรวม</th>
              </tr>
            </thead>
            <tbody>
              {kinderRoomRows.map(([room, data]) => (
                <tr key={room} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {room}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{data.count} คน</td>
                  <td className="px-4 py-3 font-semibold text-blue-900">
                    {data.conductTotal}
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">
                    {roomRecycle.get(room) ?? 0}
                  </td>
                </tr>
              ))}
              {kinderRoomRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    ยังไม่มีข้อมูลห้องระดับอนุบาล (ชื่อห้องต้องขึ้นต้นด้วย อ. หรือ อนุบาล)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature 6: primary per individual (preview of first rows) */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">
            ระดับประถมศึกษา — คะแนนรายบุคคล
          </h2>
          <Link
            href="/students"
            className="text-sm font-medium text-blue-800 hover:underline"
          >
            ดูทั้งหมด →
          </Link>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">รหัส</th>
                <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                <th className="px-4 py-3">ห้อง</th>
                <th className="px-4 py-3">คะแนนความประพฤติ</th>
                <th className="px-4 py-3">คะแนนขยะแลกแต้ม</th>
              </tr>
            </thead>
            <tbody>
              {primaryPreview.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-500">{s.studentCode}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {s.prefix ?? ""}
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{s.classRoom}</td>
                  <td
                    className={`px-4 py-3 font-semibold ${s.conductScore < 60 ? "text-red-600" : "text-blue-900"}`}
                  >
                    {s.conductScore}
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">
                    {studentRecycle.get(s.id) ?? 0}
                  </td>
                </tr>
              ))}
              {primaryStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    ยังไม่มีข้อมูลนักเรียนระดับประถม (ชื่อห้องต้องขึ้นต้นด้วย ป. หรือ ประถม)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {primaryStudents.length > PRIMARY_PREVIEW_ROWS && (
            <div className="border-t border-slate-100 px-4 py-3 text-center">
              <Link
                href="/students"
                className="text-sm font-medium text-blue-800 hover:underline"
              >
                ดูทั้งหมด {primaryStudents.length} คน →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
