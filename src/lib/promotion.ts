// Pure academic-year helpers (no DB / server-only imports) so they can be
// unit-tested and reused on the client.

/**
 * Thai academic year (พ.ศ.): starts in May. Jan–Apr belong to the
 * previous year's ปีการศึกษา.
 */
export function computeAcademicYearBE(now = new Date()) {
  const buddhistYear = now.getFullYear() + 543;
  return now.getMonth() + 1 >= 5 ? buddhistYear : buddhistYear - 1;
}

export type PromotionSuggestion = {
  classRoom: string;
  target: string; // proposed classroom for next year; "" = graduate
  graduate: boolean;
};

/**
 * Suggest next-year classroom for a Thai classroom name like "ป.1/1".
 * อ.3 → ป.1, ป.6 → ม.1 (when the school has มัธยม students) or graduation,
 * ม.3 → graduation. Unparseable names keep their current value for the
 * admin to edit manually.
 */
export function suggestPromotion(
  classRoom: string,
  schoolHasSecondary: boolean,
): PromotionSuggestion {
  const m = classRoom.trim().match(/^(อ|ป|ม)\.?\s*(\d+)\s*\/\s*(\d+)$/);
  if (!m) {
    return { classRoom, target: classRoom, graduate: false };
  }
  const [, prefix, levelStr, room] = m;
  const level = Number(levelStr);

  if (prefix === "อ") {
    if (level >= 3) return { classRoom, target: `ป.1/${room}`, graduate: false };
    return { classRoom, target: `อ.${level + 1}/${room}`, graduate: false };
  }
  if (prefix === "ป") {
    if (level >= 6) {
      return schoolHasSecondary
        ? { classRoom, target: `ม.1/${room}`, graduate: false }
        : { classRoom, target: "", graduate: true };
    }
    return { classRoom, target: `ป.${level + 1}/${room}`, graduate: false };
  }
  // มัธยม (โรงเรียนขยายโอกาสถึง ม.3)
  if (level >= 3) return { classRoom, target: "", graduate: true };
  return { classRoom, target: `ม.${level + 1}/${room}`, graduate: false };
}
