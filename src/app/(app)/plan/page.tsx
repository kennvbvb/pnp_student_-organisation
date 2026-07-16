import { requireUser } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import PlanManager from "@/components/plan/PlanManager";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const user = await requireUser();
  const canManage = hasPermission(user, "MANAGE_PLAN");
  const { year: yearParam } = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = Number(yearParam) || currentYear;

  const activities = await prisma.planActivity.findMany({
    where: { year },
    orderBy: { startDate: "asc" },
  });

  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div>
      <PageHeader
        title="แผนงานประจำปี"
        description="กำหนดกิจกรรมของสภานักเรียนในแต่ละเดือน"
        action={
          <form method="get" className="flex items-center gap-2">
            <select
              name="year"
              defaultValue={year}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-800"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  ปี {y + 543}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              แสดง
            </button>
          </form>
        }
      />

      <PlanManager
        activities={activities.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          startDate: a.startDate.toISOString(),
          endDate: a.endDate ? a.endDate.toISOString() : null,
          month: a.month,
        }))}
        canManage={canManage}
      />
    </div>
  );
}
