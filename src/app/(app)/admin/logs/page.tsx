import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import Pagination, { parsePage } from "@/components/Pagination";

const PAGE_SIZE = 25;

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: "สร้าง",
  UPDATE: "แก้ไข",
  DELETE: "ลบ",
  IMPORT: "นำเข้าข้อมูล",
};

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; loginPage?: string; auditPage?: string }>;
}) {
  await requirePermission("VIEW_LOGS");
  const { q = "", loginPage: loginPageParam, auditPage: auditPageParam } =
    await searchParams;

  const loginWhere = q ? { username: { contains: q } } : undefined;
  const auditWhere = q
    ? {
        OR: [
          { entityType: { contains: q } },
          { detail: { contains: q } },
          { user: { username: { contains: q } } },
        ],
      }
    : undefined;

  const [loginTotal, auditTotal] = await Promise.all([
    prisma.loginLog.count({ where: loginWhere }),
    prisma.auditLog.count({ where: auditWhere }),
  ]);
  const loginPage = parsePage(loginPageParam, Math.ceil(loginTotal / PAGE_SIZE));
  const auditPage = parsePage(auditPageParam, Math.ceil(auditTotal / PAGE_SIZE));

  const [loginLogs, auditLogs] = await Promise.all([
    prisma.loginLog.findMany({
      where: loginWhere,
      orderBy: { createdAt: "desc" },
      skip: (loginPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.findMany({
      where: auditWhere,
      orderBy: { createdAt: "desc" },
      skip: (auditPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { username: true, fullName: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="ประวัติการใช้งานระบบ (Log)"
        description="บันทึกการเข้าสู่ระบบและการกระทำสำคัญต่างๆ ภายในระบบ"
      />

      <form className="flex gap-3" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          aria-label="ค้นหาชื่อผู้ใช้ หรือรายการ"
          placeholder="ค้นหาชื่อผู้ใช้ หรือรายการ"
          className="w-80 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-800"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          ค้นหา
        </button>
      </form>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          ประวัติการเข้าสู่ระบบ
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">วันที่-เวลา</th>
                <th className="px-4 py-3">ชื่อผู้ใช้</th>
                <th className="px-4 py-3">ผลลัพธ์</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">User Agent</th>
              </tr>
            </thead>
            <tbody>
              {loginLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {log.username}
                  </td>
                  <td className="px-4 py-3">
                    {log.success ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                        สำเร็จ
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">
                        ไม่สำเร็จ
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {log.ipAddress ?? "-"}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-400">
                    {log.userAgent ?? "-"}
                  </td>
                </tr>
              ))}
              {loginLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={loginPage}
          pageSize={PAGE_SIZE}
          total={loginTotal}
          params={{ q }}
          pageKey="loginPage"
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          ประวัติการกระทำในระบบ
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">วันที่-เวลา</th>
                <th className="px-4 py-3">ผู้ทำรายการ</th>
                <th className="px-4 py-3">การกระทำ</th>
                <th className="px-4 py-3">ประเภทข้อมูล</th>
                <th className="px-4 py-3">รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {log.user.fullName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {log.entityType}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {log.detail ?? "-"}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={auditPage}
          pageSize={PAGE_SIZE}
          total={auditTotal}
          params={{ q }}
          pageKey="auditPage"
        />
      </div>
    </div>
  );
}
