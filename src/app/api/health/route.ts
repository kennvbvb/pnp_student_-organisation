import { prisma } from "@/lib/prisma";

/**
 * Health check: reports application + database status.
 * Returns 200 when healthy, 503 when the database is unreachable.
 * Deliberately unauthenticated and content-free so uptime monitors can use it.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "ok" });
  } catch {
    return Response.json(
      { status: "error", database: "unreachable" },
      { status: 503 },
    );
  }
}
