"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import type { Permission } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/permissions";
import type { CurrentUser } from "@/lib/session";
import { logoutAction } from "@/actions/auth";
import {
  DashboardIcon,
  StructureIcon,
  StudentsIcon,
  ConductIcon,
  HistoryIcon,
  PlanIcon,
  RecycleIcon,
  UsersCogIcon,
  LogIcon,
  SettingsIcon,
  LogoutIcon,
} from "@/components/icons";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

type NavItem = {
  href: string;
  label: string;
  icon: IconType;
  permission?: Permission;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: DashboardIcon },
  { href: "/structure", label: "โครงสร้างสภานักเรียน", icon: StructureIcon },
  { href: "/students", label: "รายชื่อนักเรียน", icon: StudentsIcon },
  {
    href: "/conduct",
    label: "บันทึกคะแนนความประพฤติ",
    icon: ConductIcon,
    permission: "MANAGE_CONDUCT",
  },
  {
    href: "/conduct/history",
    label: "ประวัติคะแนนความประพฤติ",
    icon: HistoryIcon,
    permission: "VIEW_CONDUCT_HISTORY",
  },
  { href: "/plan", label: "แผนงานประจำปี", icon: PlanIcon },
  { href: "/recycle", label: "ขยะแลกแต้ม", icon: RecycleIcon },
  { href: "/recycle/history", label: "ประวัติขยะแลกแต้ม", icon: HistoryIcon },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    href: "/admin/users",
    label: "จัดการผู้ใช้งาน",
    icon: UsersCogIcon,
    permission: "MANAGE_USERS",
  },
  {
    href: "/admin/logs",
    label: "ประวัติการใช้งาน (Log)",
    icon: LogIcon,
    permission: "VIEW_LOGS",
  },
  {
    href: "/admin/settings",
    label: "ตั้งค่าเว็บไซต์",
    icon: SettingsIcon,
    permission: "MANAGE_SETTINGS",
  },
];

function hasAccess(user: CurrentUser, item: NavItem) {
  if (!item.permission) return true;
  if (user.role === "ADMIN") return true;
  return user.permissions.includes(item.permission);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      }`}
    >
      <span
        className={`absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r-full bg-emerald-500 transition-all ${
          active ? "w-1" : "w-0"
        }`}
      />
      <Icon
        className={`h-5 w-5 shrink-0 transition-colors ${
          active ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
        }`}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export default function Sidebar({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const visibleAdminItems = ADMIN_NAV_ITEMS.filter((item) =>
    hasAccess(user, item),
  );

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white shadow-sm shadow-emerald-500/30">
          สภ
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-800">
            ระบบสภานักเรียน
          </p>
          <p className="truncate text-xs text-slate-400">โรงเรียนวัดพนมพริก</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          เมนูหลัก
        </p>
        {NAV_ITEMS.filter((item) => hasAccess(user, item)).map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return <NavLink key={item.href} item={item} active={active} />;
        })}

        {visibleAdminItems.length > 0 && (
          <>
            <p className="px-3 pt-5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              ผู้ดูแลระบบ
            </p>
            {visibleAdminItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={pathname.startsWith(item.href)}
              />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-semibold uppercase text-white">
            {initials(user.fullName) || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">
              {user.fullName}
            </p>
            <p className="truncate text-xs text-slate-400">
              {ROLE_LABELS[user.role]}
            </p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogoutIcon className="h-4 w-4" />
            ออกจากระบบ
          </button>
        </form>
      </div>
    </aside>
  );
}
