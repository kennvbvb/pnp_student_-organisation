import { describe, it, expect } from "vitest";
import { classifyLevel } from "@/lib/level";

describe("classifyLevel", () => {
  it("classifies kindergarten (อนุบาล)", () => {
    expect(classifyLevel("อ.1/1")).toBe("kindergarten");
    expect(classifyLevel("อ.3/2")).toBe("kindergarten");
    expect(classifyLevel("อนุบาล 2")).toBe("kindergarten");
  });

  it("classifies primary (ประถม)", () => {
    expect(classifyLevel("ป.1/1")).toBe("primary");
    expect(classifyLevel("ป.6/3")).toBe("primary");
    expect(classifyLevel("ประถมศึกษาปีที่ 4")).toBe("primary");
  });

  it("classifies secondary (มัธยม)", () => {
    expect(classifyLevel("ม.1/1")).toBe("secondary");
    expect(classifyLevel("ม.3/2")).toBe("secondary");
    expect(classifyLevel("มัธยม 2")).toBe("secondary");
  });

  it("returns other for unrecognized names", () => {
    expect(classifyLevel("เตรียมอนุบาล")).toBe("other");
    expect(classifyLevel("")).toBe("other");
    expect(classifyLevel("Room A")).toBe("other");
  });
});
