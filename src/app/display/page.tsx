import { getTenantBySlugServer } from "@/lib/tenant-server";
import { LEGACY_TENANT_SLUG, USE_LEGACY_QUEUE } from "@/lib/constants";
import DisplayPageClient from "@/components/queue/DisplayPageClient";

export default async function LegacyDisplayPage({
  searchParams,
}: {
  searchParams: Promise<{ kiosk?: string }>;
}) {
  const { kiosk } = await searchParams;
  const tenant = await getTenantBySlugServer(LEGACY_TENANT_SLUG);

  return (
    <DisplayPageClient
      slug={LEGACY_TENANT_SLUG}
      tenantId={tenant?.id ?? null}
      useLegacy={USE_LEGACY_QUEUE || !tenant}
      kiosk={kiosk === "1"}
    />
  );
}
