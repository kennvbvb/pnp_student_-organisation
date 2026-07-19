import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  listAcademicYears,
  suggestPromotion,
} from "@/lib/academic-year";
import { classifyLevel } from "@/lib/level";
import PageHeader from "@/components/PageHeader";
import StartYearWizard from "@/components/admin/StartYearWizard";

export default async function AcademicYearPage() {
  await requirePermission("MANAGE_SETTINGS");

  const years = await listAcademicYears();
  const current = years.find((y) => y.isCurrent) ?? years[0];

  const [conductCounts, wasteCounts, graduatedCount] = await Promise.all([
    prisma.conductDeduction.groupBy({
      by: ["academicYearId"],
      _count: true,
    }),
    prisma.wasteScoreEntry.groupBy({
      by: ["academicYearId"],
      _count: true,
    }),
    prisma.student.count({ where: { active: false, graduatedYear: { not: null } } }),
  ]);
  const conductByYear = new Map(
    conductCounts.map((c) => [c.academicYearId, c._count]),
  );
  const wasteByYear = new Map(
    wasteCounts.map((c) => [c.academicYearId, c._count]),
  );

  // Distinct classrooms of active students, with promotion suggestions.
  const classGroups = await prisma.student.groupBy({
    by: ["classRoom"],
    where: { active: true },
    _count: true,
    orderBy: { classRoom: "asc" },
  });
  const schoolHasSecondary = classGroups.some(
    (g) => classifyLevel(g.classRoom) === "secondary",
  );
  const wizardRows = classGroups.map((g) => {
    const suggestion = suggestPromotion(g.classRoom, schoolHasSecondary);
    return {
      classRoom: g.classRoom,
      count: g._count,
      suggestedTarget: suggestion.target,
      suggestedGraduate: suggestion.graduate,
    };
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="ปีการศึกษา"
        description={`ปีการศึกษาปัจจุบัน: ${current.year} — จัดการการปิดปี เลื่อนชั้น และดูข้อมูลย้อนหลัง`}
      />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          ปีการศึกษาทั้งหมด
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">ปีการศึกษา</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">รายการคะแนนความประพฤติ</th>
                <th className="px-4 py-3">รายการขยะแลกแต้ม</th>
              </tr>
            </thead>
            <tbody>
              {years.map((y) => (
                <tr key={y.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {y.year}
                  </td>
                  <td className="px-4 py-3">
                    {y.isCurrent ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                        ปัจจุบัน
                      </span>
                    ) : y.closed ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        ปิดแล้ว
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                        เปิดอยู่
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {conductByYear.get(y.id) ?? 0} รายการ
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {wasteByYear.get(y.id) ?? 0} รายการ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {graduatedCount > 0 && (
          <p className="mt-2 text-xs text-slate-400">
            มีนักเรียนที่จบการศึกษา/พ้นสภาพเก็บไว้ในระบบ {graduatedCount} คน
            (ดูได้ที่หน้ารายชื่อนักเรียนโดยรวมนักเรียนที่ปิดใช้งาน)
          </p>
        )}
      </div>

      <StartYearWizard
        currentYear={current.year}
        defaultNewYear={current.year + 1}
        rows={wizardRows}
      />
    </div>
  );
}
