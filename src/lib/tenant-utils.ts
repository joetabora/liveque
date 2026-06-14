import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, tenants } from "@/db/schema";
import { PLAN_LIMITS } from "@/lib/constants";
import type { PlanTier } from "@/db/schema/subscriptions";

export async function getTenantWithSubscription(slug: string) {
  const [row] = await db
    .select({ tenant: tenants, subscription: subscriptions })
    .from(tenants)
    .leftJoin(subscriptions, eq(tenants.id, subscriptions.tenantId))
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (!row?.tenant) return null;
  return row;
}

export async function assertSubscriptionActive(tenantId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId))
    .limit(1);

  if (!sub) return;

  const blocked = ["canceled", "unpaid", "past_due"];
  if (blocked.includes(sub.status)) {
    throw new Error("Subscription inactive. Please update billing.");
  }
}

export function getPlanLimits(planTier: PlanTier) {
  return PLAN_LIMITS[planTier] ?? PLAN_LIMITS.starter;
}

export function getClientIp(request: NextRequest): string | undefined {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    undefined
  );
}
