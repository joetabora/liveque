import { NextRequest } from "next/server";
import { eq, and, asc, max } from "drizzle-orm";
import { db } from "@/db";
import { tenants, promotions } from "@/db/schema";
import { requireTenantRole } from "@/lib/auth/permissions";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";
import {
  promotionCreateSchema,
  promotionUpdateSchema,
} from "@/lib/validation/schemas";
import { logAuditEvent } from "@/lib/audit";
import { getClientIp } from "@/lib/tenant-utils";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;
    const includeInactive =
      request.nextUrl.searchParams.get("includeInactive") === "1";

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (!tenant) {
      return handleApiError(new Error("Tenant not found"));
    }

    if (includeInactive) {
      await requireTenantRole(slug, "staff");
    }

    const rows = await db
      .select()
      .from(promotions)
      .where(
        includeInactive
          ? eq(promotions.tenantId, tenant.id)
          : and(
              eq(promotions.tenantId, tenant.id),
              eq(promotions.isActive, true)
            )
      )
      .orderBy(asc(promotions.sortOrder), asc(promotions.createdAt));

    return jsonSuccess(rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;
    const { user, tenant } = await requireTenantRole(slug, "staff");
    const body = promotionCreateSchema.parse(await request.json());

    const [maxOrder] = await db
      .select({ value: max(promotions.sortOrder) })
      .from(promotions)
      .where(eq(promotions.tenantId, tenant.id));

    const sortOrder = (maxOrder?.value ?? -1) + 1;

    const [created] = await db
      .insert(promotions)
      .values({
        tenantId: tenant.id,
        title: body.title,
        subtitle: body.subtitle ?? null,
        imageUrl: body.imageUrl?.trim() || null,
        videoUrl: body.videoUrl?.trim() || null,
        isActive: body.isActive ?? true,
        sortOrder,
      })
      .returning();

    await logAuditEvent({
      tenantId: tenant.id,
      userId: user?.id ?? null,
      action: "promotion.created",
      resourceType: "promotion",
      resourceId: created.id,
      metadata: { title: created.title },
      ipAddress: getClientIp(request),
    });

    return jsonSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
