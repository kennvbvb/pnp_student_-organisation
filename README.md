# ระบบสภานักเรียนโรงเรียนวัดพนมพริก

เว็บแอปสำหรับบริหารจัดการสภานักเรียน: ล็อกอินแบบมีบทบาท/สิทธิ์, โครงสร้างสภา,
คะแนนความประพฤติ (พร้อมนำเข้า Excel), รายชื่อนักเรียน, แผนงานประจำปีพร้อม
แจ้งเตือนกิจกรรมใกล้ถึง, กิจกรรมขยะแลกแต้ม, และแผงควบคุมผู้ดูแลระบบ

## สแตกเทคโนโลยี

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma ORM + libSQL adapter — dev ใช้ SQLite ไฟล์เดียว (`dev.db`), production ใช้ Turso (libSQL) แบบ serverless
- Auth แบบ custom: bcryptjs (hash รหัสผ่าน) + jose (JWT ใน httpOnly cookie)
- xlsx (SheetJS) สำหรับนำเข้า/ออกไฟล์ Excel

## เริ่มต้นใช้งาน (Development)

```bash
npm install
cp .env.example .env   # ปรับ SESSION_SECRET ก่อนใช้งานจริง
npm run db:migrate     # สร้างฐานข้อมูลตาม schema
npm run db:seed        # สร้างผู้ใช้ admin เริ่มต้น + ข้อมูลตัวอย่าง
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) แล้วล็อกอินด้วยบัญชี admin
เริ่มต้น (ตั้งค่าได้ผ่าน `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` ใน `.env`
ก่อนรัน seed, ค่าเริ่มต้นคือ `admin` / `ChangeMe123!`) **โปรดเปลี่ยนรหัสผ่านทันที
หลังใช้งานจริง**

## คำสั่งที่ใช้บ่อย

| คำสั่ง | คำอธิบาย |
| --- | --- |
| `npm run dev` | รันเซิร์ฟเวอร์สำหรับพัฒนา |
| `npm run build` | สร้างไฟล์สำหรับ production |
| `npm run start` | รันเซิร์ฟเวอร์ production (ต้อง build ก่อน) |
| `npm run lint` | ตรวจสอบโค้ดด้วย ESLint |
| `npm run db:migrate` | รัน Prisma migration |
| `npm run db:seed` | สร้างข้อมูลเริ่มต้น (admin, โครงสร้างตัวอย่าง, ประเภทขยะ) |
| `npm run db:generate` | สร้าง Prisma Client ใหม่หลังแก้ schema |

## บทบาทผู้ใช้งานและสิทธิ์

ระบบมี 5 บทบาท: ผู้ดูแลระบบ (ADMIN), ประธานนักเรียน, รองประธานนักเรียน,
หัวหน้าฝ่าย, สมาชิกสภานักเรียน แต่ละบัญชีมีชุดสิทธิ์ย่อยที่ปรับได้เป็นรายคน
(เช่น จัดการโครงสร้าง, บันทึก/ดูประวัติคะแนนความประพฤติ, จัดการรายชื่อนักเรียน,
จัดการแผนงาน, จัดการคะแนนขยะแลกแต้ม, จัดการผู้ใช้, ดู log, จัดการตั้งค่าเว็บไซต์)
บัญชี ADMIN มีสิทธิ์ทุกอย่างเสมอ ผู้ใช้ที่ได้รับสิทธิ์ "จัดการผู้ใช้" แต่ไม่ใช่
ADMIN จะแก้ไข/ลบบัญชี ADMIN หรือให้สิทธิ์จัดการผู้ใช้แก่คนอื่นไม่ได้

ไม่มีการสมัครสมาชิกเอง — เฉพาะ ADMIN (หรือผู้ที่ได้รับสิทธิ์จัดการผู้ใช้)
เท่านั้นที่สร้างบัญชีใหม่ได้ ผ่านเมนู "จัดการผู้ใช้งาน"

## การนำเข้าข้อมูลนักเรียนจาก Excel

หน้า "รายชื่อนักเรียน > นำเข้าข้อมูลจาก Excel" มีไฟล์ตัวอย่างให้ดาวน์โหลด
(คอลัมน์: รหัสนักเรียน, คำนำหน้า, ชื่อ, นามสกุล, ห้อง) หากรหัสนักเรียนซ้ำกับ
ที่มีอยู่แล้ว ระบบจะอัปเดตข้อมูลแทนการสร้างใหม่ และแสดงสรุปผล/ข้อผิดพลาด
รายแถวหลังนำเข้า

## Deploy ขึ้น Vercel (ใช้ Turso เป็นฐานข้อมูล)

Vercel รันแบบ serverless เขียนไฟล์ SQLite ไม่ได้ จึงใช้ **Turso (libSQL)** เป็น
ฐานข้อมูล production แอปจะสลับมาใช้ Turso อัตโนมัติเมื่อมี env `TURSO_DATABASE_URL`

**1. สร้างฐานข้อมูล Turso** (ติดตั้ง [Turso CLI](https://docs.turso.tech/cli/installation) ก่อน)

```bash
turso auth signup                       # หรือ turso auth login
turso db create pnp-student-council
turso db show pnp-student-council --url # => TURSO_DATABASE_URL (libsql://...)
turso db tokens create pnp-student-council  # => TURSO_AUTH_TOKEN
```

**2. สร้างตารางในฐานข้อมูล Turso** (รัน migration SQL ที่มีอยู่)

```bash
turso db shell pnp-student-council < prisma/migrations/20260716033403_init/migration.sql
```

**3. ใส่ข้อมูลเริ่มต้น (admin + ข้อมูลตัวอย่าง)** — รัน seed โดยชี้ไปที่ Turso

```bash
TURSO_DATABASE_URL="libsql://<db>.turso.io" \
TURSO_AUTH_TOKEN="<token>" \
SEED_ADMIN_USERNAME="admin" \
SEED_ADMIN_PASSWORD="<รหัสผ่านที่ตั้งเอง>" \
npx tsx prisma/seed.ts
```

**4. ตั้งค่า Environment Variables บน Vercel** (Project Settings → Environment Variables)

| Key | Value |
| --- | --- |
| `TURSO_DATABASE_URL` | `libsql://<db>.turso.io` |
| `TURSO_AUTH_TOKEN` | token จากขั้นตอนที่ 1 |
| `SESSION_SECRET` | ค่าสุ่มยาวๆ (เช่น `openssl rand -base64 32`) |

**5. Deploy** — import repo เข้า Vercel แล้ว deploy ได้เลย (`prisma generate` รันอัตโนมัติ
ผ่าน `postinstall`, build command ใช้ค่าเริ่มต้น `next build`)

> เมื่อแก้ schema ภายหลัง: สร้าง migration ใหม่ด้วย `npm run db:migrate` (local) แล้วนำไฟล์
> SQL ใน `prisma/migrations/<ใหม่>/migration.sql` ไปรันกับ Turso ด้วย `turso db shell` เหมือนขั้นตอนที่ 2
