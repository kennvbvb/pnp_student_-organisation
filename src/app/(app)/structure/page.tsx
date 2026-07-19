import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import OrgChart, { buildTree, flatten } from "@/components/structure/OrgChart";
import {
  StructureIcon,
  ShieldIcon,
  UsersIcon,
  UserIcon,
} from "@/components/icons";

const LEGEND = [
  { label: "ประธานนักเรียน", dot: "bg-blue-900" },
  { label: "รองประธาน", dot: "bg-sky-400" },
  { label: "หัวหน้าฝ่าย", dot: "bg-violet-400" },
  { label: "สมาชิก", dot: "bg-slate-300" },
];

export default async function StructurePage() {
  const user = await requireUser();
  const canManage = hasPermission(user, "MANAGE_STRUCTURE");

  const positions = await prisma.councilPosition.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const tree = buildTree(positions);
  const all = flatten(tree);

  const total = all.length;
  const appointed = all.filter((p) => p.holderName).length;
  const vacant = total - appointed;
  const departments = all.filter((p) => p.depth === 2).length;
  const vacantList = all.filter((p) => !p.holderName);

  return (
    <div className="space-y-6">
      <PageHeader
        title="โครงสร้างสภานักเรียน"
        description="ผังตำแหน่งและผู้ดำรงตำแหน่งในสภานักเรียน"
        action={
          canManage ? (
            <Link
              href="/structure/manage"
              className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
            >
              จัดการโครงสร้าง
            </Link>
          ) : undefined
        }
      />

      {/* Summary bar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="ตำแหน่งทั้งหมด"
          value={total}
          hint="ตำแหน่ง"
          icon={StructureIcon}
          accent="sky"
        />
        <StatCard
          label="แต่งตั้งแล้ว"
          value={appointed}
          hint="ตำแหน่ง"
          icon={UsersIcon}
          accent="emerald"
        />
        <StatCard
          label="ยังว่าง"
          value={vacant}
          hint="ตำแหน่ง"
          icon={UserIcon}
          accent="amber"
        />
        <StatCard
          label="จำนวนฝ่าย"
          value={departments}
          hint="ฝ่าย"
          icon={ShieldIcon}
          accent="violet"
        />
      </div>

      {tree.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <EmptyState
            title="ยังไม่มีข้อมูลโครงสร้างสภานักเรียน"
            description={
              canManage
                ? 'เริ่มเพิ่มตำแหน่งได้ที่ปุ่ม “จัดการโครงสร้าง”'
                : undefined
            }
          />
        </div>
      ) : (
        <OrgChart tree={tree} />
      )}

      {/* Bottom panels: legend + vacant positions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            คำอธิบายสี
          </h3>
          <ul className="space-y-2">
            {LEGEND.map((l) => (
              <li
                key={l.label}
                className="flex items-center gap-2 text-sm text-slate-600"
              >
                <span className={`h-3 w-3 rounded-full ${l.dot}`} />
                {l.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            ตำแหน่งที่ยังไม่ได้แต่งตั้ง
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              {vacantList.length}
            </span>
          </h3>
          {vacantList.length === 0 ? (
            <p className="text-sm text-emerald-600">
              ✓ ทุกตำแหน่งได้รับการแต่งตั้งแล้ว
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {vacantList.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800"
                >
                  {p.title}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
