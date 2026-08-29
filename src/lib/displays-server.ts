import { randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { displays, type Display, type DisplayLayout } from "@/db/schema";

async function ensureDisplayBySlug(
  tenantId: string,
  slug: string,
  name: string,
  layout: DisplayLayout
): Promise<Display> {
  const [existing] = await db
    .select()
    .from(displays)
    .where(and(eq(displays.tenantId, tenantId), eq(displays.slug, slug)))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(displays)
    .values({
      tenantId,
      slug,
      name,
      publicToken: randomUUID(),
      layout,
      isActive: true,
    })
    .returning();

  return created;
}

export async function ensurePortraitDisplay(
  tenantId: string
): Promise<Display> {
  return ensureDisplayBySlug(tenantId, "portrait", "Portrait Kiosk", {
    type: "portrait",
  });
}

export async function ensureMediaPortraitDisplay(
  tenantId: string
): Promise<Display> {
  return ensureDisplayBySlug(
    tenantId,
    "media-portrait",
    "Media Portrait",
    { type: "media-portrait" }
  );
}

export async function ensureKioskDisplays(tenantId: string): Promise<void> {
  await ensurePortraitDisplay(tenantId);
  await ensureMediaPortraitDisplay(tenantId);
}
