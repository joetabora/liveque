import { getTenantBySlugServer } from "@/lib/tenant-server";
import { LEGACY_TENANT_SLUG, USE_LEGACY_QUEUE } from "@/lib/constants";
import AdminPageClient from "@/components/queue/AdminPageClient";

export default async function LegacyAdminPage() {
  const tenant = await getTenantBySlugServer(LEGACY_TENANT_SLUG);

  return (
    <AdminPageClient
      slug={LEGACY_TENANT_SLUG}
      tenantId={tenant?.id ?? null}
      displayPath="/display?kiosk=1"
      portraitDisplayPath={`/${LEGACY_TENANT_SLUG}/display/portrait?kiosk=1`}
      mediaPortraitDisplayPath={`/${LEGACY_TENANT_SLUG}/display/media-portrait?kiosk=1`}
      useLegacy={USE_LEGACY_QUEUE || !tenant}
    />
  );
}
