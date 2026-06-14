import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, tenants } from "@/db/schema";
import { requireTenantRole } from "@/lib/auth/permissions";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";
import { PLAN_AMOUNTS } from "@/lib/stripe/client";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const { tenant } = await requireTenantRole(slug, "owner");

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, tenant.id))
      .limit(1);

    return jsonSuccess({
      tenant: {
        name: tenant.name,
        planTier: tenant.planTier,
        subscriptionStatus: tenant.subscriptionStatus,
        trialEndsAt: tenant.trialEndsAt,
        stripeCustomerId: tenant.stripeCustomerId,
      },
      subscription: subscription
        ? {
            status: subscription.status,
            planTier: subscription.planTier,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            currentPeriodEnd: subscription.currentPeriodEnd,
            staffLimit: subscription.staffLimit,
            displayLimit: subscription.displayLimit,
          }
        : null,
      amountCents: tenant.planTier
        ? PLAN_AMOUNTS[tenant.planTier as keyof typeof PLAN_AMOUNTS] ?? null
        : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
