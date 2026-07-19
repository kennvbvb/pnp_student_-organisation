import type { ComponentType, SVGProps } from "react";
import {
  CrownIcon,
  ShieldIcon,
  UsersIcon,
  UserIcon,
} from "@/components/icons";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export type PositionNode = {
  id: string;
  title: string;
  holderName: string | null;
  depth: number;
  children: PositionNode[];
};

export type RawPosition = {
  id: string;
  title: string;
  holderName: string | null;
  parentId: string | null;
  sortOrder: number;
};

export function buildTree(positions: RawPosition[]): PositionNode[] {
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

export function flatten(nodes: PositionNode[]): PositionNode[] {
  return nodes.flatMap((n) => [n, ...flatten(n.children)]);
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

/** The connector-line org chart (uses the .org-tree CSS in globals.css). */
export default function OrgChart({ tree }: { tree: PositionNode[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white bg-dot-grid p-6 sm:p-10">
      <ul className="org-tree">
        {tree.map((node) => (
          <TreeNode key={node.id} node={node} />
        ))}
      </ul>
    </div>
  );
}
