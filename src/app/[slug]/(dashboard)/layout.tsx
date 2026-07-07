import { notFound, redirect } from "next/navigation";
import { getTenantBySlugServer } from "@/lib/tenant-server";
import { canSkipQueueAuth } from "@/lib/auth/queue-access";
import { requireTenantRole } from "@/lib/auth/permissions";
import { TenantShell } from "@/components/layout/TenantShell";
import type { Tenant } from "@/db/schema/tenants";

async function resolveDashboardTenant(slug: string): Promise<Tenant> {
  if (canSkipQueueAuth(slug)) {
    const tenant = await getTenantBySlugServer(slug);
    if (!tenant) notFound();
    return tenant;
  }

  try {
    const { tenant } = await requireTenantRole(slug, "staff");
    return tenant;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        redirect(`/login?callbackUrl=/${slug}/admin`);
      }
      if (error.message === "Forbidden" || error.message === "Tenant not found") {
        notFound();
      }
    }
    throw error;
  }
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await resolveDashboardTenant(slug);

  return (
    <TenantShell slug={slug} tenantName={tenant.name}>
      <div className="p-6 lg:p-8">{children}</div>
    </TenantShell>
  );
}
