import { notFound, redirect } from "next/navigation";
import { getTenantBySlugServer } from "@/lib/tenant-server";
import { requireTenantRole } from "@/lib/auth/permissions";
import { TenantShell } from "@/components/layout/TenantShell";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const { tenant } = await requireTenantRole(slug, "staff");

    return (
      <TenantShell slug={slug} tenantName={tenant.name}>
        <div className="p-6 lg:p-8">{children}</div>
      </TenantShell>
    );
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
