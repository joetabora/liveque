import { requireAuth, getUserMemberships, isPlatformAdmin } from "@/lib/auth/permissions";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await requireAuth();
    const memberships = await getUserMemberships(user.id);
    const platformAdmin = await isPlatformAdmin(user.id);

    return jsonSuccess({
      tenants: memberships.map(({ tenant, membership }) => ({
        slug: tenant.slug,
        name: tenant.name,
        role: membership.role,
      })),
      platformAdmin,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
