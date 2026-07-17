export type GradeLevel = "kindergarten" | "primary" | "secondary" | "other";

export const LEVEL_LABELS: Record<GradeLevel, string> = {
  kindergarten: "อนุบาล",
  primary: "ประถมศึกษา",
  secondary: "มัธยมศึกษา",
  other: "อื่นๆ",
};

/**
 * Classify a classroom name into a grade level based on its leading text.
 * อ. / อนุบาล → kindergarten, ป. / ประถม → primary, ม. / มัธยม → secondary.
 */
export function classifyLevel(classRoom: string): GradeLevel {
  const s = classRoom.trim();
  if (s.startsWith("อนุบาล") || /^อ\.?\s*\d/.test(s) || s.startsWith("อ."))
    return "kindergarten";
  if (s.startsWith("ประถม") || /^ป\.?\s*\d/.test(s) || s.startsWith("ป."))
    return "primary";
  if (s.startsWith("มัธยม") || /^ม\.?\s*\d/.test(s) || s.startsWith("ม."))
    return "secondary";
  return "other";
}
