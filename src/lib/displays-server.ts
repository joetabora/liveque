import { randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { displays, type Display } from "@/db/schema";

export async function ensurePortraitDisplay(
  tenantId: string
): Promise<Display> {
  const [existing] = await db
    .select()
    .from(displays)
    .where(
      and(
        eq(displays.tenantId, tenantId),
        eq(displays.slug, "portrait")
      )
    )
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(displays)
    .values({
      tenantId,
      slug: "portrait",
      name: "Portrait Kiosk",
      publicToken: randomUUID(),
      layout: { type: "portrait" },
      isActive: true,
    })
    .returning();

  return created;
}
