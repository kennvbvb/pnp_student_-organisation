import "server-only";
import { prisma } from "@/lib/prisma";
import { computeAcademicYearBE } from "@/lib/promotion";

export { computeAcademicYearBE, suggestPromotion } from "@/lib/promotion";
export type { PromotionSuggestion } from "@/lib/promotion";

/**
 * Get the current academic year, creating it on first use. On creation,
 * legacy entries with no year are claimed into it (one-time backfill).
 */
export async function getCurrentAcademicYear() {
  const existing = await prisma.academicYear.findFirst({
    where: { isCurrent: true },
  });
  if (existing) return existing;

  const year = computeAcademicYearBE();
  const created = await prisma.academicYear.upsert({
    where: { year },
    create: { year, isCurrent: true },
    update: { isCurrent: true, closed: false, closedAt: null },
  });
  await prisma.conductDeduction.updateMany({
    where: { academicYearId: null },
    data: { academicYearId: created.id },
  });
  await prisma.wasteScoreEntry.updateMany({
    where: { academicYearId: null },
    data: { academicYearId: created.id },
  });
  return created;
}

export async function listAcademicYears() {
  // Ensure at least the current year exists before listing.
  await getCurrentAcademicYear();
  return prisma.academicYear.findMany({ orderBy: { year: "desc" } });
}
