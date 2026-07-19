import { describe, it, expect } from "vitest";
import {
  isAdminRole,
  ROLE_DEFAULT_PERMISSIONS,
  PERMISSIONS,
  ROOT_ADMIN_USERNAME,
} from "@/lib/permissions";

describe("isAdminRole", () => {
  it("is true for admin-level roles", () => {
    expect(isAdminRole("SUPER_ADMIN")).toBe(true);
    expect(isAdminRole("ADMIN")).toBe(true);
  });
  it("is false for non-admin roles", () => {
    expect(isAdminRole("PRESIDENT")).toBe(false);
    expect(isAdminRole("MEMBER")).toBe(false);
  });
});

describe("ROLE_DEFAULT_PERMISSIONS", () => {
  it("grants super admin and admin every permission", () => {
    expect(ROLE_DEFAULT_PERMISSIONS.SUPER_ADMIN).toEqual([...PERMISSIONS]);
    expect(ROLE_DEFAULT_PERMISSIONS.ADMIN).toEqual([...PERMISSIONS]);
  });
  it("grants members no permissions by default", () => {
    expect(ROLE_DEFAULT_PERMISSIONS.MEMBER).toEqual([]);
  });
  it("never grants MANAGE_USERS to non-admin roles by default", () => {
    for (const role of ["PRESIDENT", "VICE_PRESIDENT", "DEPT_HEAD", "MEMBER"] as const) {
      expect(ROLE_DEFAULT_PERMISSIONS[role]).not.toContain("MANAGE_USERS");
    }
  });
});

describe("ROOT_ADMIN_USERNAME", () => {
  it("is the reserved admin account name", () => {
    expect(ROOT_ADMIN_USERNAME).toBe("admin");
  });
});
