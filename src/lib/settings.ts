import "server-only";
import { prisma } from "@/lib/prisma";

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.siteSetting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export type Branding = {
  siteTitle: string;
  schoolName: string;
  /** Data-URL of the uploaded school logo, or null to use the default mark. */
  logo: string | null;
  contactInfo: string;
};

export async function getBranding(): Promise<Branding> {
  const settings = await getSettings();
  return {
    siteTitle: settings.SITE_TITLE || "ระบบสภานักเรียน",
    schoolName: settings.SCHOOL_NAME || "โรงเรียนวัดพนมพริก",
    logo: settings.SCHOOL_LOGO || null,
    contactInfo: settings.CONTACT_INFO || "",
  };
}
