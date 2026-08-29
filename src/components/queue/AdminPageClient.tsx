"use client";

import dynamic from "next/dynamic";

const AdminDashboard = dynamic(() => import("@/components/queue/AdminDashboard"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-iron-black">
      <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function AdminPageClient({
  slug,
  tenantId,
  displayPath,
  portraitDisplayPath,
  mediaPortraitDisplayPath,
  useLegacy,
  embedded,
}: {
  slug: string;
  tenantId: string | null;
  displayPath?: string;
  portraitDisplayPath?: string;
  mediaPortraitDisplayPath?: string;
  useLegacy: boolean;
  embedded?: boolean;
}) {
  return (
    <AdminDashboard
      slug={slug}
      tenantId={tenantId}
      displayPath={displayPath}
      portraitDisplayPath={portraitDisplayPath}
      mediaPortraitDisplayPath={mediaPortraitDisplayPath}
      useLegacy={useLegacy}
      embedded={embedded}
    />
  );
}
