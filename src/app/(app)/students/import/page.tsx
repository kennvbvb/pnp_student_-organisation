import { requirePermission } from "@/lib/auth-guard";
import PageHeader from "@/components/PageHeader";
import ImportForm from "@/components/students/ImportForm";

export default async function StudentsImportPage() {
  await requirePermission("MANAGE_STUDENTS");

  return (
    <div>
      <PageHeader
        title="นำเข้าข้อมูลนักเรียนจาก Excel"
        description="ดาวน์โหลดไฟล์ตัวอย่าง กรอกข้อมูล แล้วอัปโหลดกลับเข้าระบบ"
      />

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">
          ขั้นตอนการนำเข้าข้อมูล
        </h2>
        <ol className="list-inside list-decimal space-y-1 text-sm text-slate-600">
          <li>ดาวน์โหลดไฟล์ตัวอย่าง (Template) ด้านล่าง</li>
          <li>
            กรอกข้อมูลนักเรียนตามคอลัมน์: รหัสนักเรียน, คำนำหน้า, ชื่อ, นามสกุล, ห้อง
          </li>
          <li>บันทึกไฟล์แล้วอัปโหลดกลับเข้าระบบ</li>
          <li>
            หากรหัสนักเรียนซ้ำกับที่มีอยู่แล้ว ระบบจะอัปเดตข้อมูลแทนการสร้างใหม่
          </li>
        </ol>
        <a
          href="/api/students/import/template"
          className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          ดาวน์โหลดไฟล์ตัวอย่าง
        </a>
      </div>

      <ImportForm />
    </div>
  );
}
