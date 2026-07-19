import { prisma } from "@/lib/prisma";
import { getBranding } from "@/lib/settings";
import { getCurrentAcademicYear } from "@/lib/academic-year";
import OrgChart, { buildTree } from "@/components/structure/OrgChart";
import EmptyState from "@/components/EmptyState";

export const metadata = { title: "สภานักเรียน" };

// Public, no-login landing: council structure + recycle leaderboard.
// Deliberately excludes any conduct/personal data.
export default async function PublicHomePage() {
  const branding = await getBranding();
  const academicYear = await getCurrentAcademicYear();

  const [positions, roomGroups, studentGroups] = await Promise.all([
    prisma.councilPosition.findMany({ orderBy: { sortOrder: "asc" } }),
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
  ]);

  const tree = buildTree(positions);

  const topRooms = roomGroups
    .filter((r) => r.classRoom)
    .map((r) => [r.classRoom as string, r._sum.pointsAwarded ?? 0] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const studentIds = studentGroups
    .filter((s) => s.studentId)
    .map((s) => s.studentId as string);
  const studentInfos = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true, classRoom: true },
  });
  const infoMap = new Map(studentInfos.map((s) => [s.id, s]));
  const topStudents = studentGroups
    .filter((s) => s.studentId && infoMap.has(s.studentId))
    .map((s) => {
      const info = infoMap.get(s.studentId as string)!;
      return {
        name: `${info.firstName} ${info.lastName}`,
        classRoom: info.classRoom,
        points: s._sum.pointsAwarded ?? 0,
      };
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 px-4 py-14 text-center text-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold sm:text-4xl">
            สภานักเรียน{branding.schoolName}
          </h1>
          <p className="mt-3 text-sm text-blue-100/80 sm:text-base">
            โครงสร้างสภานักเรียนและอันดับกิจกรรมขยะแลกแต้ม
            ประจำปีการศึกษา {academicYear.year}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        {/* Structure */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-slate-800">
            โครงสร้างสภานักเรียน
          </h2>
          {tree.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white">
              <EmptyState title="ยังไม่มีข้อมูลโครงสร้างสภานักเรียน" />
            </div>
          ) : (
            <OrgChart tree={tree} />
          )}
        </section>

        {/* Recycle leaderboards */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-slate-800">
            อันดับขยะแลกแต้ม ประจำปีการศึกษา {academicYear.year}
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <LeaderboardCard
              title="อันดับรายห้อง"
              rows={topRooms.map(([room, points], i) => ({
                rank: i + 1,
                label: room,
                points,
              }))}
            />
            <LeaderboardCard
              title="อันดับรายบุคคล"
              rows={topStudents.map((s, i) => ({
                rank: i + 1,
                label: `${s.name} (${s.classRoom})`,
                points: s.points,
              }))}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

const MEDALS = ["🥇", "🥈", "🥉"];

function LeaderboardCard({
  title,
  rows,
}: {
  title: string;
  rows: { rank: number; label: string; points: number }[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">ยังไม่มีข้อมูล</p>
      ) : (
        <ol className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.rank}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                <span className="w-6 text-center">
                  {MEDALS[r.rank - 1] ?? r.rank}
                </span>
                {r.label}
              </span>
              <span className="font-semibold text-emerald-700">
                {r.points} คะแนน
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
