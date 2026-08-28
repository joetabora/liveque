import { notFound } from "next/navigation";
import { getTenantBySlugServer, getDisplayBySlug } from "@/lib/tenant-server";
import { USE_LEGACY_QUEUE } from "@/lib/constants";
import DisplayPageClient from "@/components/queue/DisplayPageClient";
import type { DisplayLayout } from "@/db/schema/displays";

export default async function TenantDisplayPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; displaySlug: string }>;
  searchParams: Promise<{ kiosk?: string }>;
}) {
  const { slug, displaySlug } = await params;
  const { kiosk } = await searchParams;
  const tenant = await getTenantBySlugServer(slug);
  if (!tenant) notFound();

  const display = await getDisplayBySlug(tenant.id, displaySlug);
  if (!display || !display.isActive) notFound();

  const layoutType: DisplayLayout["type"] = display.layout?.type ?? "default";

  return (
    <DisplayPageClient
      slug={slug}
      tenantId={tenant.id}
      useLegacy={USE_LEGACY_QUEUE}
      kiosk={kiosk === "1"}
      layoutType={layoutType}
    />
  );
}
