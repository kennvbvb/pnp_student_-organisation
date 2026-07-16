import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission, type CurrentUser } from "@/lib/session";
import type { Permission } from "@/lib/permissions";

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requirePermission(
  permission: Permission,
): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasPermission(user, permission)) {
    redirect("/dashboard?denied=1");
  }
  return user;
}
