import { notFound } from "next/navigation";
import { getTenantBySlugServer } from "@/lib/tenant-server";
import { getMediaAdminItems } from "@/lib/media-playlist-server";
import MediaSettingsClient from "./MediaSettingsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MediaSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlugServer(slug);
  if (!tenant) notFound();

  const initialItems = await getMediaAdminItems(slug);

  return <MediaSettingsClient slug={slug} initialItems={initialItems} />;
}
