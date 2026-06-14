import { notFound } from "next/navigation";
import { getTenantBySlugServer } from "@/lib/tenant-server";
import { TenantShell } from "@/components/layout/TenantShell";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlugServer(slug);
  if (!tenant) notFound();

  return (
    <TenantShell slug={slug} tenantName={tenant.name}>
      <div className="p-6 lg:p-8">{children}</div>
    </TenantShell>
  );
}
