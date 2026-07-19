import type { Role } from "@/generated/prisma/enums";

export const PERMISSIONS = [
  "MANAGE_USERS",
  "VIEW_LOGS",
  "MANAGE_STRUCTURE",
  "MANAGE_STUDENTS",
  "MANAGE_CONDUCT",
  "VIEW_CONDUCT_HISTORY",
  "DELETE_CONDUCT_HISTORY",
  "MANAGE_PLAN",
  "MANAGE_RECYCLE",
  "DELETE_RECYCLE_HISTORY",
  "EXPORT_DATA",
  "MANAGE_SETTINGS",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  MANAGE_USERS: "จัดการผู้ใช้และสิทธิ์",
  VIEW_LOGS: "ดูประวัติการใช้งาน (Log)",
  MANAGE_STRUCTURE: "จัดการโครงสร้างสภานักเรียน",
  MANAGE_STUDENTS: "จัดการรายชื่อนักเรียน",
  MANAGE_CONDUCT: "บันทึกคะแนนความประพฤติ",
  VIEW_CONDUCT_HISTORY: "ดูประวัติคะแนนความประพฤติ",
  DELETE_CONDUCT_HISTORY: "ยกเลิกรายการคะแนนความประพฤติ",
  MANAGE_PLAN: "จัดการแผนงานประจำปี",
  MANAGE_RECYCLE: "บันทึกคะแนนกิจกรรมขยะแลกแต้ม",
  DELETE_RECYCLE_HISTORY: "ยกเลิกรายการคะแนนขยะแลกแต้ม",
  EXPORT_DATA: "ส่งออกข้อมูล (Export)",
  MANAGE_SETTINGS: "จัดการตั้งค่าเว็บไซต์",
};

/** Permissions granted by default to a role when a user account is created. Admins can add/remove per-user afterward. */
export const ROLE_DEFAULT_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [...PERMISSIONS],
  ADMIN: [...PERMISSIONS],
  PRESIDENT: [
    "VIEW_LOGS",
    "MANAGE_STRUCTURE",
    "MANAGE_STUDENTS",
    "MANAGE_CONDUCT",
    "VIEW_CONDUCT_HISTORY",
    "MANAGE_PLAN",
    "MANAGE_RECYCLE",
    "EXPORT_DATA",
  ],
  VICE_PRESIDENT: [
    "MANAGE_CONDUCT",
    "VIEW_CONDUCT_HISTORY",
    "MANAGE_PLAN",
    "MANAGE_RECYCLE",
    "EXPORT_DATA",
  ],
  DEPT_HEAD: ["MANAGE_CONDUCT", "MANAGE_RECYCLE"],
  MEMBER: [],
};

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "ผู้ดูแลระบบหลัก",
  ADMIN: "ผู้ดูแลระบบ",
  PRESIDENT: "ประธานนักเรียน",
  VICE_PRESIDENT: "รองประธานนักเรียน",
  DEPT_HEAD: "หัวหน้าฝ่าย",
  MEMBER: "สมาชิกสภานักเรียน",
};

/** Permissions that only admin-level accounts may grant, to prevent privilege escalation by delegated user-managers. */
export const ADMIN_ONLY_GRANTABLE: Permission[] = ["MANAGE_USERS"];

/** True for roles with full administrative power (implicit all permissions). */
export function isAdminRole(role: Role) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}
