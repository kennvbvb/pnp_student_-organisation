import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";

type PositionNode = {
  id: string;
  title: string;
  holderName: string | null;
  children: PositionNode[];
};

function buildTree(
  positions: { id: string; title: string; holderName: string | null; parentId: string | null; sortOrder: number }[],
): PositionNode[] {
  const byParent = new Map<string | null, typeof positions>();
  for (const p of positions) {
    const list = byParent.get(p.parentId) ?? [];
    list.push(p);
    byParent.set(p.parentId, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  function build(parentId: string | null): PositionNode[] {
    const children = byParent.get(parentId) ?? [];
    return children.map((c) => ({
      id: c.id,
      title: c.title,
      holderName: c.holderName,
      children: build(c.id),
    }));
  }

  return build(null);
}

function PositionCard({ node }: { node: PositionNode }) {
  return (
    <div className="flex flex-col items-center">
      <div className="min-w-[10rem] rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-center shadow-sm">
        <p className="text-sm font-semibold text-emerald-800">
          {node.title}
        </p>
        <p className="text-xs text-emerald-600">
          {node.holderName ?? "ยังไม่กำหนดผู้ดำรงตำแหน่ง"}
        </p>
      </div>
      {node.children.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-6 border-t border-dashed border-slate-300 pt-4">
          {node.children.map((child) => (
            <PositionCard key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export default async function StructurePage() {
  const user = await requireUser();
  const canManage = hasPermission(user, "MANAGE_STRUCTURE");

  const positions = await prisma.councilPosition.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const tree = buildTree(positions);

  return (
    <div>
      <PageHeader
        title="โครงสร้างสภานักเรียน"
        description="ผังตำแหน่งและผู้ดำรงตำแหน่งในสภานักเรียน"
        action={
          canManage ? (
            <Link
              href="/structure/manage"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              จัดการโครงสร้าง
            </Link>
          ) : undefined
        }
      />

      {tree.length === 0 ? (
        <p className="text-sm text-slate-500">ยังไม่มีข้อมูลโครงสร้างสภานักเรียน</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-8">
          <div className="flex justify-center gap-10">
            {tree.map((node) => (
              <PositionCard key={node.id} node={node} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
