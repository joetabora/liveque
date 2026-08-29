import { and, asc, eq, isNotNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { promotions, tenants } from "@/db/schema";
import { parsePromotionVideoUrl } from "@/lib/promotion-video";
import type {
  MediaAdminItem,
  MediaPlaylistItem,
} from "@/lib/media-playlist-types";

export type { MediaAdminItem, MediaPlaylistItem };

/** All promotions for the Media admin UI (including hidden / image-only). */
export async function getMediaAdminItems(
  tenantSlug: string
): Promise<MediaAdminItem[]> {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant) return [];

  const rows = await db
    .select()
    .from(promotions)
    .where(eq(promotions.tenantId, tenant.id))
    .orderBy(asc(promotions.sortOrder), asc(promotions.createdAt));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: row.imageUrl,
    videoUrl: row.videoUrl,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  }));
}

/** Active video promotions for Media Portrait playback. */
export async function getMediaPortraitPlaylist(
  tenantSlug: string
): Promise<MediaPlaylistItem[]> {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant) return [];

  const rows = await db
    .select()
    .from(promotions)
    .where(
      and(
        eq(promotions.tenantId, tenant.id),
        eq(promotions.isActive, true),
        isNotNull(promotions.videoUrl),
        ne(promotions.videoUrl, "")
      )
    )
    .orderBy(asc(promotions.sortOrder), asc(promotions.createdAt));

  return rows.flatMap((row) => {
    const videoUrl = row.videoUrl?.trim() ?? "";
    if (!videoUrl || !parsePromotionVideoUrl(videoUrl, { loop: false })) {
      return [];
    }
    return [
      {
        id: row.id,
        title: row.title,
        subtitle: row.subtitle,
        imageUrl: row.imageUrl,
        videoUrl,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
      },
    ];
  });
}
