import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { tenants, displays } from "@/db/schema";

export async function getTenantBySlugServer(slug: string) {
  try {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    return tenant ?? null;
  } catch {
    return null;
  }
}

export async function getDisplayBySlug(tenantId: string, displaySlug: string) {
  const [display] = await db
    .select()
    .from(displays)
    .where(
      and(
        eq(displays.tenantId, tenantId),
        eq(displays.slug, displaySlug)
      )
    )
    .limit(1);

  return display ?? null;
}
