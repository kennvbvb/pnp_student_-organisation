import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import type { Permission } from "@/lib/permissions";

const COOKIE_NAME = "session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.userId !== "string") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  const token = await createSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export type CurrentUser = {
  id: string;
  username: string;
  fullName: string;
  role:
    | "SUPER_ADMIN"
    | "ADMIN"
    | "PRESIDENT"
    | "VICE_PRESIDENT"
    | "DEPT_HEAD"
    | "MEMBER";
  active: boolean;
  mustChangePassword: boolean;
  permissions: Permission[];
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const verified = await verifySessionToken(token);
  if (!verified) return null;

  const user = await prisma.user.findUnique({
    where: { id: verified.userId },
    include: { permissions: true },
  });

  if (!user || !user.active) return null;

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    active: user.active,
    mustChangePassword: user.mustChangePassword,
    permissions: user.permissions.map((p) => p.permission) as Permission[],
  };
}

export function hasPermission(
  user: Pick<CurrentUser, "role" | "permissions">,
  permission: Permission,
) {
  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") return true;
  return user.permissions.includes(permission);
}
