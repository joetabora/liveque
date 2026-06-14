import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  memberships,
  platformAdmins,
  tenants,
  type MembershipRole,
} from "@/db/schema";
import { getAuthProvider, getAppUserByAuthId } from "./authjs";

const roleHierarchy: Record<MembershipRole, number> = {
  staff: 1,
  owner: 2,
};

export async function requireAuth() {
  const provider = getAuthProvider();
  const session = await provider.getSession();
  if (!session) throw new Error("Unauthorized");

  const appUser = await getAppUserByAuthId(session.userId);
  if (!appUser) throw new Error("User not found");
  return appUser;
}

export async function requireTenantRole(
  tenantSlug: string,
  minimumRole: MembershipRole = "staff"
) {
  const appUser = await requireAuth();

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant) throw new Error("Tenant not found");

  const [membership] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.tenantId, tenant.id),
        eq(memberships.userId, appUser.id)
      )
    )
    .limit(1);

  if (!membership) throw new Error("Forbidden");

  if (roleHierarchy[membership.role] < roleHierarchy[minimumRole]) {
    throw new Error("Forbidden");
  }

  return { user: appUser, tenant, membership };
}

export async function requirePlatformAdmin() {
  const appUser = await requireAuth();

  const [admin] = await db
    .select()
    .from(platformAdmins)
    .where(eq(platformAdmins.userId, appUser.id))
    .limit(1);

  if (!admin) throw new Error("Forbidden");
  return appUser;
}

export async function getTenantBySlug(slug: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  return tenant ?? null;
}

export async function getUserMemberships(userId: string) {
  return db
    .select({
      membership: memberships,
      tenant: tenants,
    })
    .from(memberships)
    .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
    .where(eq(memberships.userId, userId));
}

export async function isPlatformAdmin(userId: string) {
  const [admin] = await db
    .select()
    .from(platformAdmins)
    .where(eq(platformAdmins.userId, userId))
    .limit(1);
  return !!admin;
}
