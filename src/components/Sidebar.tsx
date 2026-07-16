"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Permission } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/permissions";
import type { CurrentUser } from "@/lib/session";
import { logoutAction } from "@/actions/auth";

type NavItem = {
  href: string;
  label: string;
  permission?: Permission;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "แดชบอร์ด" },
  { href: "/structure", label: "โครงสร้างสภานักเรียน" },
  { href: "/students", label: "รายชื่อนักเรียน" },
  { href: "/conduct", label: "บันทึกคะแนนความประพฤติ", permission: "MANAGE_CONDUCT" },
  {
    href: "/conduct/history",
    label: "ประวัติคะแนนความประพฤติ",
    permission: "VIEW_CONDUCT_HISTORY",
  },
  { href: "/plan", label: "แผนงานประจำปี" },
  { href: "/recycle", label: "ขยะแลกแต้ม" },
  { href: "/recycle/history", label: "ประวัติขยะแลกแต้ม" },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin/users", label: "จัดการผู้ใช้งาน", permission: "MANAGE_USERS" },
  { href: "/admin/logs", label: "ประวัติการใช้งาน (Log)", permission: "VIEW_LOGS" },
  { href: "/admin/settings", label: "ตั้งค่าเว็บไซต์", permission: "MANAGE_SETTINGS" },
];

function hasAccess(user: CurrentUser, item: NavItem) {
  if (!item.permission) return true;
  if (user.role === "ADMIN") return true;
  return user.permissions.includes(item.permission);
}

export default function Sidebar({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const visibleAdminItems = ADMIN_NAV_ITEMS.filter((item) =>
    hasAccess(user, item),
  );

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-sm font-bold text-slate-800">ระบบสภานักเรียน</p>
        <p className="text-xs text-slate-500">โรงเรียนวัดพนมพริก</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.filter((item) => hasAccess(user, item)).map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}

        {visibleAdminItems.length > 0 && (
          <>
            <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              ผู้ดูแลระบบ
            </p>
            {visibleAdminItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="border-t border-slate-200 px-4 py-4">
        <p className="truncate text-sm font-medium text-slate-800">
          {user.fullName}
        </p>
        <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            ออกจากระบบ
          </button>
        </form>
      </div>
    </aside>
  );
}
