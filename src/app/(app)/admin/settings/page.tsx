import { requirePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  await requirePermission("MANAGE_SETTINGS");

  const rows = await prisma.siteSetting.findMany();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <div>
      <PageHeader
        title="ตั้งค่าเว็บไซต์"
        description="แก้ไขข้อมูลพื้นฐานของเว็บไซต์สภานักเรียน"
      />
      <SettingsForm settings={settings} />
    </div>
  );
}
