import { notFound } from "next/navigation";
import { getTenantBySlugServer } from "@/lib/tenant-server";
import { USE_LEGACY_QUEUE } from "@/lib/constants";
import DisplayPageClient from "@/components/queue/DisplayPageClient";

export default async function TenantDisplayPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; displaySlug: string }>;
  searchParams: Promise<{ kiosk?: string }>;
}) {
  const { slug } = await params;
  const { kiosk } = await searchParams;
  const tenant = await getTenantBySlugServer(slug);
  if (!tenant) notFound();

  return (
    <DisplayPageClient
      slug={slug}
      tenantId={tenant.id}
      useLegacy={USE_LEGACY_QUEUE}
      kiosk={kiosk === "1"}
    />
  );
}
