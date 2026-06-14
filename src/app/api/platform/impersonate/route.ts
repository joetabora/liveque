import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/auth/permissions";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";
import { logAuditEvent } from "@/lib/audit";
import { APP_URL } from "@/lib/constants";
import { z } from "zod";

const schema = z.object({ tenantSlug: z.string() });

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePlatformAdmin();
    const { tenantSlug } = schema.parse(await request.json());

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return handleApiError(new Error("Tenant not found"));
    }

    await logAuditEvent({
      tenantId: tenant.id,
      userId: admin.id,
      action: "platform.impersonate",
      resourceType: "tenant",
      resourceId: tenant.id,
      metadata: { adminEmail: admin.email },
    });

    return jsonSuccess({
      url: `${APP_URL}/${tenantSlug}/admin`,
      expiresIn: "Use admin session — re-authenticate as platform admin to exit",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
