import { NextRequest } from "next/server";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api-utils";
import { requireQueueAccess } from "@/lib/auth/queue-access";
import { logAuditEvent } from "@/lib/audit";
import { USE_LEGACY_QUEUE } from "@/lib/constants";
import {
  serverAddToQueue,
  serverUpdateQueueItem,
  serverStartService,
  serverCompleteService,
  serverCallNext,
  serverSkipItem,
  serverRemoveItem,
  serverClearQueue,
  serverReorderQueue,
} from "@/lib/queue/server-operations";
import {
  queueItemInputSchema,
  queueItemUpdateSchema,
  reorderSchema,
} from "@/lib/validation/schemas";
import {
  assertSubscriptionActive,
  getClientIp,
  getTenantWithSubscription,
} from "@/lib/tenant-utils";
import { queueWriteRateLimit, checkRateLimit } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ slug: string }> };

async function resolveTenant(slug: string) {
  const row = await getTenantWithSubscription(slug);
  if (!row) throw new Error("Tenant not found");
  return row;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;
    const { user, tenant } = await requireQueueAccess(slug, "staff");
    await assertSubscriptionActive(tenant.id);

    const rateCheck = await checkRateLimit(
      queueWriteRateLimit,
      `queue:${tenant.id}:${user?.id ?? "anon"}`
    );
    if (!rateCheck.success) return jsonError("Too many requests", 429);

    const body = await request.json();
    const input = queueItemInputSchema.parse(body);

    const id = await serverAddToQueue(
      tenant.id,
      input,
      USE_LEGACY_QUEUE,
      user?.id
    );

    await logAuditEvent({
      tenantId: tenant.id,
      userId: user?.id ?? null,
      action: "queue.add",
      resourceType: "queue_item",
      resourceId: id,
      metadata: { name: input.name },
      ipAddress: getClientIp(request),
    });

    return jsonSuccess({ id });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;
    const { user, tenant } = await requireQueueAccess(slug, "staff");
    await assertSubscriptionActive(tenant.id);

    await serverClearQueue(tenant.id, USE_LEGACY_QUEUE);

    await logAuditEvent({
      tenantId: tenant.id,
      userId: user?.id ?? null,
      action: "queue.clear",
      resourceType: "queue",
      ipAddress: getClientIp(request),
    });

    return jsonSuccess({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
