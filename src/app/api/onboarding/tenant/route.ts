import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { tenants, memberships, displays, subscriptions } from "@/db/schema";
import { requireAuth } from "@/lib/auth/permissions";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";
import { onboardingTenantSchema } from "@/lib/validation/schemas";
import { logAuditEvent } from "@/lib/audit";
import { ensureKioskDisplays } from "@/lib/displays-server";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, slug } = onboardingTenantSchema.parse(body);

    const [existing] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (existing) {
      return handleApiError(new Error("This URL slug is already taken"));
    }

    const [tenant] = await db
      .insert(tenants)
      .values({
        name,
        slug,
        subscriptionStatus: "trialing",
        planTier: "starter",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      })
      .returning();

    await db.insert(memberships).values({
      tenantId: tenant.id,
      userId: user.id,
      role: "owner",
    });

    await db.insert(displays).values({
      tenantId: tenant.id,
      slug: "main",
      name: "Main Display",
      publicToken: randomUUID(),
      layout: { type: "default" },
    });

    await ensureKioskDisplays(tenant.id);

    await db.insert(subscriptions).values({
      tenantId: tenant.id,
      status: "trialing",
      planTier: "starter",
      locationLimit: 1,
      displayLimit: 1,
      staffLimit: 3,
    });

    await logAuditEvent({
      tenantId: tenant.id,
      userId: user.id,
      action: "tenant.created",
      resourceType: "tenant",
      resourceId: tenant.id,
    });

    return jsonSuccess({ tenant }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
