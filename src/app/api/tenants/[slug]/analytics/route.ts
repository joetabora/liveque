import { NextRequest } from "next/server";
import { eq, and, gte, sql, count } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { requireTenantRole } from "@/lib/auth/permissions";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;
    const { tenant } = await requireTenantRole(slug, "staff");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayStats] = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.tenantId, tenant.id),
          eq(auditLogs.action, "queue.add"),
          gte(auditLogs.createdAt, today)
        )
      );

    const hourlyStats = await db
      .select({
        hour: sql<number>`extract(hour from ${auditLogs.createdAt})`,
        count: count(),
      })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.tenantId, tenant.id),
          eq(auditLogs.action, "queue.add"),
          gte(auditLogs.createdAt, sql`now() - interval '7 days'`)
        )
      )
      .groupBy(sql`extract(hour from ${auditLogs.createdAt})`);

    const [completed] = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.tenantId, tenant.id),
          eq(auditLogs.action, "queue.complete"),
          gte(auditLogs.createdAt, today)
        )
      );

    const [removed] = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.tenantId, tenant.id),
          eq(auditLogs.action, "queue.remove"),
          gte(auditLogs.createdAt, today)
        )
      );

    const appointmentsToday = todayStats?.count ?? 0;
    const noShowRate =
      appointmentsToday > 0
        ? Math.round(((removed?.count ?? 0) / appointmentsToday) * 100)
        : 0;

    return jsonSuccess({
      appointmentsToday,
      completedToday: completed?.count ?? 0,
      noShowRate,
      peakHours: hourlyStats.sort((a, b) => b.count - a.count).slice(0, 3),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
