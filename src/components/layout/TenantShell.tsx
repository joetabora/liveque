"use client";

import { AppShell } from "@/components/layout/AppShell";

export function TenantShell({
  slug,
  tenantName,
  children,
}: {
  slug: string;
  tenantName: string;
  children: React.ReactNode;
}) {
  const navItems = [
    { href: `/${slug}/admin`, label: "Queue" },
    { href: `/${slug}/analytics`, label: "Analytics" },
    { href: `/${slug}/displays`, label: "Displays" },
    { href: `/${slug}/settings/branding`, label: "Branding" },
    { href: `/${slug}/settings/promotions`, label: "Promotions" },
    { href: `/${slug}/settings/media`, label: "Media" },
    { href: `/${slug}/settings/team`, label: "Team" },
    { href: `/${slug}/settings/billing`, label: "Billing" },
  ];

  return (
    <AppShell slug={slug} tenantName={tenantName} navItems={navItems}>
      {children}
    </AppShell>
  );
}
