import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { promotions, tenants } from "@/db/schema";
import MediaSettingsClient, {
  type MediaItem,
} from "./MediaSettingsClient";

export default async function MediaSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (!tenant) notFound();

  const rows = await db
    .select()
    .from(promotions)
    .where(eq(promotions.tenantId, tenant.id))
    .orderBy(asc(promotions.sortOrder), asc(promotions.createdAt));

  const initialItems: MediaItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: row.imageUrl,
    videoUrl: row.videoUrl,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  }));

  return <MediaSettingsClient slug={slug} initialItems={initialItems} />;
}
