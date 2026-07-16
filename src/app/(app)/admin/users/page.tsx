import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import UserManager from "@/components/admin/UserManager";
import type { Permission } from "@/lib/permissions";

export default async function AdminUsersPage() {
  const actor = await requirePermission("MANAGE_USERS");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { permissions: true },
  });

  return (
    <div>
      <PageHeader
        title="จัดการผู้ใช้งาน"
        description="สร้างบัญชีผู้ใช้ กำหนดบทบาท และให้สิทธิ์การใช้งานแต่ละส่วน"
      />
      <UserManager
        users={users.map((u) => ({
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          role: u.role,
          active: u.active,
          permissions: u.permissions.map((p) => p.permission) as Permission[],
        }))}
        actorId={actor.id}
        actorIsAdmin={actor.role === "ADMIN"}
      />
    </div>
  );
}
