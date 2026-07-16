import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { ROLE_DEFAULT_PERMISSIONS } from "../src/lib/permissions";

async function main() {
  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        username: adminUsername,
        passwordHash,
        fullName: "ผู้ดูแลระบบ",
        role: "ADMIN",
        permissions: {
          create: ROLE_DEFAULT_PERMISSIONS.ADMIN.map((permission) => ({
            permission,
          })),
        },
      },
    });
    console.log(
      `Seeded admin user "${adminUsername}" / "${adminPassword}" — โปรดเปลี่ยนรหัสผ่านทันทีหลังใช้งานจริง`,
    );
  } else {
    console.log(`Admin user "${adminUsername}" already exists, skipping.`);
  }

  const positionCount = await prisma.councilPosition.count();
  if (positionCount === 0) {
    const president = await prisma.councilPosition.create({
      data: { title: "ประธานนักเรียน", sortOrder: 0 },
    });
    const vicePresident = await prisma.councilPosition.create({
      data: {
        title: "รองประธานนักเรียน",
        parentId: president.id,
        sortOrder: 0,
      },
    });
    const departments = [
      "ฝ่ายวิชาการ",
      "ฝ่ายกิจกรรม",
      "ฝ่ายปฏิคม",
      "ฝ่ายสารสนเทศ",
      "ฝ่ายสิ่งแวดล้อม",
    ];
    for (let i = 0; i < departments.length; i++) {
      const head = await prisma.councilPosition.create({
        data: {
          title: `หัวหน้า${departments[i]}`,
          parentId: vicePresident.id,
          sortOrder: i,
        },
      });
      await prisma.councilPosition.create({
        data: {
          title: `สมาชิก${departments[i]}`,
          parentId: head.id,
          sortOrder: 0,
        },
      });
    }
    console.log("Seeded sample council structure.");
  }

  const wasteTypeCount = await prisma.wasteType.count();
  if (wasteTypeCount === 0) {
    await prisma.wasteType.createMany({
      data: [
        { name: "พลาสติก", unit: "กิโลกรัม", pointsPerUnit: 10 },
        { name: "กระดาษ", unit: "กิโลกรัม", pointsPerUnit: 8 },
        { name: "โลหะ/กระป๋อง", unit: "กิโลกรัม", pointsPerUnit: 15 },
        { name: "แก้ว", unit: "กิโลกรัม", pointsPerUnit: 6 },
        { name: "ขวดพลาสติก (PET)", unit: "ชิ้น", pointsPerUnit: 1 },
      ],
    });
    console.log("Seeded sample waste types.");
  }

  const settingCount = await prisma.siteSetting.count();
  if (settingCount === 0) {
    await prisma.siteSetting.createMany({
      data: [
        { key: "SCHOOL_NAME", value: "โรงเรียนวัดพนมพริก" },
        { key: "SITE_TITLE", value: "ระบบสภานักเรียนโรงเรียนวัดพนมพริก" },
        { key: "CONTACT_INFO", value: "" },
      ],
    });
    console.log("Seeded default site settings.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
