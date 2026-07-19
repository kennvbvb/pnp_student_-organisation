import { describe, it, expect } from "vitest";
import { parsePage, pageWindow } from "@/lib/pagination";

describe("parsePage", () => {
  it("clamps to [1, totalPages]", () => {
    expect(parsePage("3", 10)).toBe(3);
    expect(parsePage("0", 10)).toBe(1);
    expect(parsePage("-5", 10)).toBe(1);
    expect(parsePage("999", 10)).toBe(10);
  });

  it("defaults to 1 for invalid input", () => {
    expect(parsePage(undefined, 10)).toBe(1);
    expect(parsePage("abc", 10)).toBe(1);
  });

  it("never returns below 1 even with zero total pages", () => {
    expect(parsePage("2", 0)).toBe(1);
  });
});

describe("pageWindow", () => {
  it("lists every page when small", () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("inserts ellipsis for large ranges", () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, "…", 20]);
    expect(pageWindow(10, 20)).toEqual([1, "…", 9, 10, 11, "…", 20]);
    expect(pageWindow(20, 20)).toEqual([1, "…", 19, 20]);
  });
});
