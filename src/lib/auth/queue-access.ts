import { requireTenantRole, getTenantBySlug } from "@/lib/auth/permissions";
import { LEGACY_TENANT_SLUG } from "@/lib/constants";
import type { MembershipRole } from "@/db/schema/memberships";

export async function requireQueueAccess(
  slug: string,
  minimumRole: MembershipRole = "staff"
) {
  if (
    process.env.SKIP_QUEUE_AUTH === "true" &&
    slug === LEGACY_TENANT_SLUG
  ) {
    const tenant = await getTenantBySlug(slug);
    if (!tenant) throw new Error("Tenant not found");
    return { user: null, tenant, membership: null };
  }

  return requireTenantRole(slug, minimumRole);
}
