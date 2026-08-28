"use client";

import dynamic from "next/dynamic";
import { TenantProvider } from "@/contexts/TenantContext";
import type { DisplayLayout } from "@/db/schema/displays";

const DisplayBoard = dynamic(() => import("@/components/queue/DisplayBoard"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-iron-black">
      <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

const PortraitDisplayBoard = dynamic(
  () => import("@/components/queue/PortraitDisplayBoard"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-iron-black">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

export default function DisplayPageClient({
  slug,
  tenantId,
  useLegacy,
  kiosk,
  layoutType = "default",
}: {
  slug: string;
  tenantId: string | null;
  useLegacy: boolean;
  kiosk?: boolean;
  layoutType?: DisplayLayout["type"];
}) {
  const isPortrait = layoutType === "portrait";

  return (
    <TenantProvider slug={slug}>
      {isPortrait ? (
        <PortraitDisplayBoard
          slug={slug}
          tenantId={tenantId}
          useLegacy={useLegacy}
          kiosk={kiosk}
        />
      ) : (
        <DisplayBoard tenantId={tenantId} useLegacy={useLegacy} kiosk={kiosk} />
      )}
    </TenantProvider>
  );
}
