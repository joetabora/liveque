import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, memberships } from "@/db/schema";
import { requireTenantRole } from "@/lib/auth/permissions";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";
import { inviteMemberSchema } from "@/lib/validation/schemas";
import { getPlanLimits } from "@/lib/tenant-utils";
import { count } from "drizzle-orm";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;
    const { tenant } = await requireTenantRole(slug, "owner");

    const members = await db
      .select({
        membership: memberships,
        user: users,
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(eq(memberships.tenantId, tenant.id));

    return jsonSuccess(members);
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
    const { tenant } = await requireTenantRole(slug, "owner");
    const body = inviteMemberSchema.parse(await request.json());

    const limits = getPlanLimits(tenant.planTier as "starter" | "professional" | "enterprise");
    if (limits.staff) {
      const [memberCount] = await db
        .select({ count: count() })
        .from(memberships)
        .where(eq(memberships.tenantId, tenant.id));

      if ((memberCount?.count ?? 0) >= limits.staff) {
        return handleApiError(new Error("Staff limit reached. Upgrade your plan."));
      }
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email.toLowerCase()))
      .limit(1);

    if (!existingUser) {
      return handleApiError(
        new Error("User must sign up first before being invited")
      );
    }

    await db
      .insert(memberships)
      .values({
        tenantId: tenant.id,
        userId: existingUser.id,
        role: body.role,
      })
      .onConflictDoNothing();

    return jsonSuccess({ ok: true }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
