import { eq, sql, count } from "drizzle-orm";
import { db } from "@/db";
import { tenants, subscriptions } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/auth/permissions";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";
import { PLAN_AMOUNTS } from "@/lib/stripe/client";

export async function GET() {
  try {
    await requirePlatformAdmin();

    const allTenants = await db
      .select({
        tenant: tenants,
        subscription: subscriptions,
      })
      .from(tenants)
      .leftJoin(subscriptions, eq(tenants.id, subscriptions.tenantId));

    const activeCount = allTenants.filter(
      (t) => t.tenant.subscriptionStatus === "active" || t.tenant.subscriptionStatus === "trialing"
    ).length;

    const mrr = allTenants.reduce((sum, row) => {
      const tier = row.tenant.planTier as keyof typeof PLAN_AMOUNTS;
      if (row.tenant.subscriptionStatus === "active" && PLAN_AMOUNTS[tier]) {
        return sum + PLAN_AMOUNTS[tier] / 100;
      }
      return sum;
    }, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const newThisMonth = allTenants.filter(
      (t) => t.tenant.createdAt >= thisMonth
    ).length;

    return jsonSuccess({
      tenants: allTenants.map((r) => ({
        id: r.tenant.id,
        slug: r.tenant.slug,
        name: r.tenant.name,
        planTier: r.tenant.planTier,
        subscriptionStatus: r.tenant.subscriptionStatus,
        createdAt: r.tenant.createdAt,
      })),
      stats: {
        totalTenants: allTenants.length,
        activeTenants: activeCount,
        mrr: Math.round(mrr),
        newThisMonth,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
