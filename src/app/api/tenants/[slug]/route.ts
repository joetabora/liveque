import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants, displays } from "@/db/schema";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (!tenant) {
      return handleApiError(new Error("Tenant not found"));
    }

    const tenantDisplays = await db
      .select({
        id: displays.id,
        slug: displays.slug,
        name: displays.name,
        layout: displays.layout,
        isActive: displays.isActive,
      })
      .from(displays)
      .where(eq(displays.tenantId, tenant.id));

    return jsonSuccess({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      logoUrl: tenant.logoUrl,
      brandColor: tenant.brandColor,
      accentColor: tenant.accentColor,
      welcomeMessage: tenant.welcomeMessage,
      displayHeadline: tenant.displayHeadline,
      settings: tenant.settings,
      displays: tenantDisplays,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
