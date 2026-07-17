import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { requireUser } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import {
  StructureIcon,
  CrownIcon,
  ShieldIcon,
  UsersIcon,
  UserIcon,
} from "@/components/icons";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

type PositionNode = {
  id: string;
  title: string;
  holderName: string | null;
  depth: number;
  children: PositionNode[];
};

type RawPosition = {
  id: string;
  title: string;
  holderName: string | null;
  parentId: string | null;
  sortOrder: number;
};

function buildTree(positions: RawPosition[]): PositionNode[] {
  const byParent = new Map<string | null, RawPosition[]>();
  for (const p of positions) {
    const list = byParent.get(p.parentId) ?? [];
    list.push(p);
    byParent.set(p.parentId, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  function build(parentId: string | null, depth: number): PositionNode[] {
    const children = byParent.get(parentId) ?? [];
    return children.map((c) => ({
      id: c.id,
      title: c.title,
      holderName: c.holderName,
      depth,
      children: build(c.id, depth + 1),
    }));
  }

  return build(null, 0);
}

// Tier styling by depth: president (dark) -> vice (blue) -> dept head (violet) -> member (gray)
const TIERS: {
  card: string;
  iconWrap: string;
  title: string;
  holder: string;
  icon: IconType;
}[] = [
  {
    card: "border-blue-900 bg-gradient-to-br from-blue-900 to-indigo-900 text-white",
    iconWrap: "bg-white/15 text-white",
    title: "text-white",
    holder: "text-blue-100/90",
    icon: CrownIcon,
  },
  {
    card: "border-sky-200 bg-sky-50",
    iconWrap: "bg-sky-100 text-sky-700",
    title: "text-sky-900",
    holder: "text-sky-700/80",
    icon: ShieldIcon,
  },
  {
    card: "border-violet-200 bg-violet-50",
    iconWrap: "bg-violet-100 text-violet-700",
    title: "text-violet-900",
    holder: "text-violet-700/80",
    icon: UsersIcon,
  },
  {
    card: "border-slate-200 bg-slate-50",
    iconWrap: "bg-slate-200 text-slate-600",
    title: "text-slate-800",
    holder: "text-slate-500",
    icon: UserIcon,
  },
];

const LEGEND = [
  { label: "ประธานนักเรียน", dot: "bg-blue-900" },
  { label: "รองประธาน", dot: "bg-sky-400" },
  { label: "หัวหน้าฝ่าย", dot: "bg-violet-400" },
  { label: "สมาชิก", dot: "bg-slate-300" },
];

function PositionCard({ node }: { node: PositionNode }) {
  const tier = TIERS[Math.min(node.depth, TIERS.length - 1)];
  const Icon = tier.icon;
  const appointed = !!node.holderName;

  return (
    <div
      className={`inline-flex min-w-[11rem] max-w-[15rem] flex-col items-center gap-1.5 rounded-2xl border px-4 py-3 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${tier.card}`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${tier.iconWrap}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className={`text-sm font-bold leading-tight ${tier.title}`}>
        {node.title}
      </p>
      <p className={`text-xs ${tier.holder}`}>
        {node.holderName ?? "ยังไม่กำหนด"}
      </p>
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
          appointed
            ? "bg-emerald-100 text-emerald-700"
            : "bg-amber-100 text-amber-700"
        }`}
      >
        {appointed ? "แต่งตั้งแล้ว" : "ว่าง"}
      </span>
    </div>
  );
}

function TreeNode({ node }: { node: PositionNode }) {
  return (
    <li>
      <PositionCard node={node} />
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

function flatten(nodes: PositionNode[]): PositionNode[] {
  return nodes.flatMap((n) => [n, ...flatten(n.children)]);
}

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
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white bg-dot-grid p-6 sm:p-10">
          <ul className="org-tree">
            {tree.map((node) => (
              <TreeNode key={node.id} node={node} />
            ))}
          </ul>
        </div>
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
