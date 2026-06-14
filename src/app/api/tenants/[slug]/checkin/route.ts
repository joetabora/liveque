import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";
import { checkInSchema } from "@/lib/validation/schemas";
import { serverCheckIn } from "@/lib/queue/server-operations";
import { assertSubscriptionActive } from "@/lib/tenant-utils";
import { checkInRateLimit, checkRateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";
import { getClientIp } from "@/lib/tenant-utils";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (!tenant) return handleApiError(new Error("Tenant not found"));

    await assertSubscriptionActive(tenant.id);

    const ip = getClientIp(request) ?? "unknown";
    const rateCheck = await checkRateLimit(checkInRateLimit, `checkin:${tenant.id}:${ip}`);
    if (!rateCheck.success) return handleApiError(new Error("Too many requests"));

    const body = checkInSchema.parse(await request.json());
    const id = await serverCheckIn(tenant.id, body);

    await logAuditEvent({
      tenantId: tenant.id,
      userId: null,
      action: "queue.checkin",
      resourceType: "queue_item",
      resourceId: id,
      metadata: { name: body.name, source: "qr" },
      ipAddress: ip,
    });

    return jsonSuccess({ id }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
