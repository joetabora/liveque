import { eq } from "drizzle-orm";
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
    .where(eq(displays.tenantId, tenantId))
    .limit(1);

  const allDisplays = await db
    .select()
    .from(displays)
    .where(eq(displays.tenantId, tenantId));

  return (
    allDisplays.find((d) => d.slug === displaySlug) ??
    allDisplays.find((d) => d.slug === "main") ??
    null
  );
}
