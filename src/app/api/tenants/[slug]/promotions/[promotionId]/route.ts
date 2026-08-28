import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { promotions } from "@/db/schema";
import { requireTenantRole } from "@/lib/auth/permissions";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";
import { promotionUpdateSchema } from "@/lib/validation/schemas";
import { logAuditEvent } from "@/lib/audit";
import { getClientIp } from "@/lib/tenant-utils";

type RouteContext = { params: Promise<{ slug: string; promotionId: string }> };

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug, promotionId } = await context.params;
    const { user, tenant } = await requireTenantRole(slug, "staff");
    const body = promotionUpdateSchema.parse(await request.json());

    const [existing] = await db
      .select()
      .from(promotions)
      .where(
        and(
          eq(promotions.id, promotionId),
          eq(promotions.tenantId, tenant.id)
        )
      )
      .limit(1);

    if (!existing) {
      return handleApiError(new Error("Promotion not found"));
    }

    const updates: Record<string, unknown> = {
      ...body,
      updatedAt: new Date(),
    };

    if (body.imageUrl !== undefined) {
      updates.imageUrl =
        body.imageUrl && body.imageUrl.trim() ? body.imageUrl.trim() : null;
    }
    if (body.videoUrl !== undefined) {
      updates.videoUrl =
        body.videoUrl && body.videoUrl.trim() ? body.videoUrl.trim() : null;
    }

    const [updated] = await db
      .update(promotions)
      .set(updates)
      .where(eq(promotions.id, promotionId))
      .returning();

    await logAuditEvent({
      tenantId: tenant.id,
      userId: user?.id ?? null,
      action: "promotion.updated",
      resourceType: "promotion",
      resourceId: promotionId,
      metadata: body,
      ipAddress: getClientIp(request),
    });

    return jsonSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug, promotionId } = await context.params;
    const { user, tenant } = await requireTenantRole(slug, "staff");

    const [existing] = await db
      .select()
      .from(promotions)
      .where(
        and(
          eq(promotions.id, promotionId),
          eq(promotions.tenantId, tenant.id)
        )
      )
      .limit(1);

    if (!existing) {
      return handleApiError(new Error("Promotion not found"));
    }

    await db.delete(promotions).where(eq(promotions.id, promotionId));

    await logAuditEvent({
      tenantId: tenant.id,
      userId: user?.id ?? null,
      action: "promotion.deleted",
      resourceType: "promotion",
      resourceId: promotionId,
      metadata: { title: existing.title },
      ipAddress: getClientIp(request),
    });

    return jsonSuccess({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
