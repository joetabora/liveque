import { requireTenantRole, getTenantBySlug } from "@/lib/auth/permissions";
import { LEGACY_TENANT_SLUG } from "@/lib/constants";
import type { MembershipRole } from "@/db/schema/memberships";

export function canSkipQueueAuth(slug: string): boolean {
  return process.env.SKIP_QUEUE_AUTH === "true" && slug === LEGACY_TENANT_SLUG;
}

export async function requireQueueAccess(
  slug: string,
  minimumRole: MembershipRole = "staff"
) {
  if (canSkipQueueAuth(slug)) {
    const tenant = await getTenantBySlug(slug);
    if (!tenant) throw new Error("Tenant not found");
    return { user: null, tenant, membership: null };
  }

  return requireTenantRole(slug, minimumRole);
}
