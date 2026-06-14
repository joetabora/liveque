import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";
import { requireQueueAccess } from "@/lib/auth/queue-access";
import { logAuditEvent } from "@/lib/audit";
import { USE_LEGACY_QUEUE } from "@/lib/constants";
import { serverSkipItem } from "@/lib/queue/server-operations";
import { assertSubscriptionActive, getClientIp } from "@/lib/tenant-utils";

type RouteContext = { params: Promise<{ slug: string; itemId: string }> };

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug, itemId } = await context.params;
    const { user, tenant } = await requireQueueAccess(slug, "staff");
    await assertSubscriptionActive(tenant.id);

    await serverSkipItem(tenant.id, itemId, USE_LEGACY_QUEUE);

    await logAuditEvent({
      tenantId: tenant.id,
      userId: user?.id ?? null,
      action: "queue.skip",
      resourceType: "queue_item",
      resourceId: itemId,
      ipAddress: getClientIp(request),
    });

    return jsonSuccess({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
