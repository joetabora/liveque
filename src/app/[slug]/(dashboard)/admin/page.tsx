import { notFound } from "next/navigation";
import { getTenantBySlugServer } from "@/lib/tenant-server";
import { USE_LEGACY_QUEUE } from "@/lib/constants";
import AdminPageClient from "@/components/queue/AdminPageClient";

export default async function TenantAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlugServer(slug);
  if (!tenant) notFound();

  return (
    <AdminPageClient
      slug={slug}
      tenantId={tenant.id}
      displayPath={`/${slug}/display/main`}
      useLegacy={USE_LEGACY_QUEUE}
      embedded
    />
  );
}
