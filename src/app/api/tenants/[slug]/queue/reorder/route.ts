import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";
import { requireQueueAccess } from "@/lib/auth/queue-access";
import { logAuditEvent } from "@/lib/audit";
import { USE_LEGACY_QUEUE } from "@/lib/constants";
import { serverReorderQueue } from "@/lib/queue/server-operations";
import { reorderSchema } from "@/lib/validation/schemas";
import { assertSubscriptionActive, getClientIp } from "@/lib/tenant-utils";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;
    const { user, tenant } = await requireQueueAccess(slug, "staff");
    await assertSubscriptionActive(tenant.id);

    const body = await request.json();
    const { items } = reorderSchema.parse(body);

    await serverReorderQueue(tenant.id, items, USE_LEGACY_QUEUE);

    await logAuditEvent({
      tenantId: tenant.id,
      userId: user?.id ?? null,
      action: "queue.reorder",
      resourceType: "queue",
      metadata: { count: items.length },
      ipAddress: getClientIp(request),
    });

    return jsonSuccess({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
