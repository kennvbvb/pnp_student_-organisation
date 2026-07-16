import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import AlertBanner from "@/components/AlertBanner";
import {
  StudentsIcon,
  StructureIcon,
  ConductIcon,
  RecycleIcon,
  BellIcon,
} from "@/components/icons";

const UPCOMING_WINDOW_DAYS = 7;

function formatThaiDate(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function DashboardPage() {
  const user = await requireUser();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const upcomingUntil = new Date(now);
  upcomingUntil.setDate(upcomingUntil.getDate() + UPCOMING_WINDOW_DAYS);

  const [
    studentCount,
    positionCount,
    conductThisMonth,
    wasteThisMonth,
    upcomingActivities,
  ] = await Promise.all([
    prisma.student.count({ where: { active: true } }),
    prisma.councilPosition.count(),
    prisma.conductDeduction.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.wasteScoreEntry.aggregate({
      _sum: { pointsAwarded: true },
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.planActivity.findMany({
      where: { startDate: { gte: now, lte: upcomingUntil } },
      orderBy: { startDate: "asc" },
      take: 5,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={`สวัสดี, ${user.fullName}`}
        description="ภาพรวมระบบสภานักเรียนโรงเรียนวัดพนมพริก"
      />

      {upcomingActivities.length > 0 && (
        <div className="mb-6">
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
          hint={`รวม ${conductThisMonth._sum.amount ?? 0} คะแนน`}
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
    </div>
  );
}
