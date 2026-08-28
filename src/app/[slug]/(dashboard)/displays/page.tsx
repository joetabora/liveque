"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/AppShell";
import { APP_URL } from "@/lib/constants";

interface DisplayRow {
  slug: string;
  name: string;
  layout?: { type?: string };
  isActive?: boolean;
}

const layoutLabels: Record<string, string> = {
  default: "Landscape",
  compact: "Compact",
  portrait: "Portrait",
};

export default function DisplaysPage() {
  const { slug } = useParams<{ slug: string }>();
  const [displays, setDisplays] = useState<DisplayRow[]>([]);

  useEffect(() => {
    fetch(`/api/tenants/${slug}`)
      .then((r) => r.json())
      .then((data) => setDisplays(data.displays ?? []));
  }, [slug]);

  const hasPortrait = displays.some((d) => d.slug === "portrait");

  return (
    <div>
      <PageHeader title="Displays" description="Manage your TV and kiosk display URLs" />
      {!hasPortrait && displays.length > 0 && (
        <p className="mb-4 text-sm text-amber-400/90 bg-amber-950/30 border border-amber-900/50 rounded-xl px-4 py-3">
          Portrait kiosk is not set up in this database yet. Run{" "}
          <code className="text-amber-200">npm run db:seed</code> against this
          environment&apos;s Neon URL, then refresh.
        </p>
      )}
      <div className="space-y-4">
        {displays.map((d) => {
          const layoutType = d.layout?.type ?? "default";
          const layoutLabel = layoutLabels[layoutType] ?? layoutType;
          const kioskUrl = `${APP_URL}/${slug}/display/${d.slug}?kiosk=1`;

          return (
            <div
              key={d.slug}
              className="bg-iron-panel border border-iron-border rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{d.name}</p>
                  <span className="text-xs uppercase tracking-wide text-gray-500 bg-iron-dark px-2 py-0.5 rounded">
                    {layoutLabel}
                  </span>
                  {d.isActive === false && (
                    <span className="text-xs uppercase tracking-wide text-red-400">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1 truncate">
                  {APP_URL}/{slug}/display/{d.slug}
                </p>
                <p className="text-xs text-gray-600 mt-1 truncate">
                  Kiosk: {kioskUrl}
                </p>
              </div>
              <a
                href={`/${slug}/display/${d.slug}?kiosk=1`}
                target="_blank"
                className="text-sm text-brand-primary hover:underline flex-shrink-0"
              >
                Open →
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
