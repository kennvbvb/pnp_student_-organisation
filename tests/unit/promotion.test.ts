import { describe, it, expect } from "vitest";
import { computeAcademicYearBE, suggestPromotion } from "@/lib/promotion";

describe("computeAcademicYearBE", () => {
  it("uses the current Buddhist year from May onward", () => {
    expect(computeAcademicYearBE(new Date("2026-05-01T00:00:00"))).toBe(2569);
    expect(computeAcademicYearBE(new Date("2026-12-31T00:00:00"))).toBe(2569);
  });

  it("uses the previous Buddhist year for Jan–Apr", () => {
    expect(computeAcademicYearBE(new Date("2026-04-30T00:00:00"))).toBe(2568);
    expect(computeAcademicYearBE(new Date("2026-01-01T00:00:00"))).toBe(2568);
  });
});

describe("suggestPromotion", () => {
  it("promotes within primary", () => {
    expect(suggestPromotion("ป.1/1", false)).toEqual({
      classRoom: "ป.1/1",
      target: "ป.2/1",
      graduate: false,
    });
  });

  it("promotes อ.3 into ป.1", () => {
    expect(suggestPromotion("อ.3/2", false).target).toBe("ป.1/2");
  });

  it("graduates ป.6 when the school has no secondary level", () => {
    expect(suggestPromotion("ป.6/1", false)).toEqual({
      classRoom: "ป.6/1",
      target: "",
      graduate: true,
    });
  });

  it("promotes ป.6 into ม.1 when the school has secondary students", () => {
    expect(suggestPromotion("ป.6/1", true).target).toBe("ม.1/1");
  });

  it("graduates ม.3", () => {
    expect(suggestPromotion("ม.3/1", true).graduate).toBe(true);
  });

  it("keeps unparseable classroom names unchanged", () => {
    expect(suggestPromotion("พิเศษ", false)).toEqual({
      classRoom: "พิเศษ",
      target: "พิเศษ",
      graduate: false,
    });
  });
});
