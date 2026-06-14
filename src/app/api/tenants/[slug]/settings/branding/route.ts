import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireTenantRole } from "@/lib/auth/permissions";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";
import { tenantBrandingSchema } from "@/lib/validation/schemas";
import { logAuditEvent } from "@/lib/audit";
import { getClientIp } from "@/lib/tenant-utils";

type RouteContext = { params: Promise<{ slug: string }> };

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;
    const { user, tenant } = await requireTenantRole(slug, "owner");
    const body = tenantBrandingSchema.parse(await request.json());

    const [updated] = await db
      .update(tenants)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(tenants.id, tenant.id))
      .returning();

    await logAuditEvent({
      tenantId: tenant.id,
      userId: user?.id ?? null,
      action: "tenant.branding_updated",
      resourceType: "tenant",
      resourceId: tenant.id,
      metadata: body,
      ipAddress: getClientIp(request),
    });

    return jsonSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
