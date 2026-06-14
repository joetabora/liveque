import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";
import { requireQueueAccess } from "@/lib/auth/queue-access";
import { logAuditEvent } from "@/lib/audit";
import { USE_LEGACY_QUEUE } from "@/lib/constants";
import { serverCallNext } from "@/lib/queue/server-operations";
import { assertSubscriptionActive, getClientIp } from "@/lib/tenant-utils";
import { queueWriteRateLimit, checkRateLimit } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ slug: string }> };

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
    if (!rateCheck.success) {
      return handleApiError(new Error("Too many requests"));
    }

    const called = await serverCallNext(tenant.id, USE_LEGACY_QUEUE);

    await logAuditEvent({
      tenantId: tenant.id,
      userId: user?.id ?? null,
      action: "queue.call_next",
      resourceType: "queue",
      metadata: { called },
      ipAddress: getClientIp(request),
    });

    return jsonSuccess({ called });
  } catch (error) {
    return handleApiError(error);
  }
}
