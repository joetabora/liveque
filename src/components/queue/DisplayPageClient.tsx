"use client";

import dynamic from "next/dynamic";
import { TenantProvider } from "@/contexts/TenantContext";
import type { DisplayLayout } from "@/db/schema/displays";
import type { MediaPlaylistItem } from "@/lib/media-playlist-types";

const loadingSpinner = (
  <div className="min-h-screen flex items-center justify-center bg-iron-black">
    <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const DisplayBoard = dynamic(() => import("@/components/queue/DisplayBoard"), {
  ssr: false,
  loading: () => loadingSpinner,
});

const PortraitDisplayBoard = dynamic(
  () => import("@/components/queue/PortraitDisplayBoard"),
  {
    ssr: false,
    loading: () => loadingSpinner,
  }
);

const MediaPortraitDisplayBoard = dynamic(
  () => import("@/components/queue/MediaPortraitDisplayBoard"),
  {
    ssr: false,
    loading: () => loadingSpinner,
  }
);

export default function DisplayPageClient({
  slug,
  tenantId,
  useLegacy,
  kiosk,
  layoutType = "default",
  initialMediaPlaylist = [],
}: {
  slug: string;
  tenantId: string | null;
  useLegacy: boolean;
  kiosk?: boolean;
  layoutType?: DisplayLayout["type"];
  initialMediaPlaylist?: MediaPlaylistItem[];
}) {
  return (
    <TenantProvider slug={slug}>
      {layoutType === "media-portrait" ? (
        <MediaPortraitDisplayBoard
          slug={slug}
          kiosk={kiosk}
          initialPlaylist={initialMediaPlaylist}
        />
      ) : layoutType === "portrait" ? (
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
