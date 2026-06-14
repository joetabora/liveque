"use client";

import dynamic from "next/dynamic";
import { TenantProvider } from "@/contexts/TenantContext";

const DisplayBoard = dynamic(() => import("@/components/queue/DisplayBoard"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-iron-black">
      <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function DisplayPageClient({
  slug,
  tenantId,
  useLegacy,
  kiosk,
}: {
  slug: string;
  tenantId: string | null;
  useLegacy: boolean;
  kiosk?: boolean;
}) {
  return (
    <TenantProvider slug={slug}>
      <DisplayBoard tenantId={tenantId} useLegacy={useLegacy} kiosk={kiosk} />
    </TenantProvider>
  );
}
