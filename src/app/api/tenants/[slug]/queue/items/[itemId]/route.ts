import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";
import { requireQueueAccess } from "@/lib/auth/queue-access";
import { logAuditEvent } from "@/lib/audit";
import { USE_LEGACY_QUEUE } from "@/lib/constants";
import {
  serverUpdateQueueItem,
  serverStartService,
  serverCompleteService,
  serverSkipItem,
  serverRemoveItem,
} from "@/lib/queue/server-operations";
import { queueItemUpdateSchema } from "@/lib/validation/schemas";
import { assertSubscriptionActive, getClientIp } from "@/lib/tenant-utils";
import { queueWriteRateLimit, checkRateLimit } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ slug: string; itemId: string }> };

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug, itemId } = await context.params;
    const { user, tenant } = await requireQueueAccess(slug, "staff");
    await assertSubscriptionActive(tenant.id);

    const body = await request.json();
    const input = queueItemUpdateSchema.parse(body);

    await serverUpdateQueueItem(tenant.id, itemId, input, USE_LEGACY_QUEUE);

    await logAuditEvent({
      tenantId: tenant.id,
      userId: user?.id ?? null,
      action: "queue.update",
      resourceType: "queue_item",
      resourceId: itemId,
      ipAddress: getClientIp(request),
    });

    return jsonSuccess({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug, itemId } = await context.params;
    const { user, tenant } = await requireQueueAccess(slug, "staff");
    await assertSubscriptionActive(tenant.id);

    await serverRemoveItem(tenant.id, itemId, USE_LEGACY_QUEUE);

    await logAuditEvent({
      tenantId: tenant.id,
      userId: user?.id ?? null,
      action: "queue.remove",
      resourceType: "queue_item",
      resourceId: itemId,
      ipAddress: getClientIp(request),
    });

    return jsonSuccess({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
