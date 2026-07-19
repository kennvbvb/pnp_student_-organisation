import "server-only";
import { prisma } from "@/lib/prisma";

export async function logAudit(params: {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  detail?: string;
}) {
  // Snapshot the actor's identity so the log stays readable even if the
  // user account is later deleted or renamed.
  const actor = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { username: true, fullName: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      detail: params.detail,
      actorUsername: actor?.username,
      actorFullName: actor?.fullName,
    },
  });
}
