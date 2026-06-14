"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { APP_URL } from "@/lib/constants";

export default function DisplaysPage() {
  const { slug } = useParams<{ slug: string }>();
  const [displays, setDisplays] = useState<Array<{ slug: string; name: string }>>([]);

  useEffect(() => {
    fetch(`/api/tenants/${slug}`)
      .then((r) => r.json())
      .then((data) => setDisplays(data.displays ?? []));
  }, [slug]);

  return (
    <div>
      <PageHeader title="Displays" description="Manage your TV and kiosk display URLs" />
      <div className="space-y-4">
        {displays.map((d) => (
          <div key={d.slug} className="bg-iron-panel border border-iron-border rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{d.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {APP_URL}/{slug}/display/{d.slug}
              </p>
            </div>
            <a
              href={`/${slug}/display/${d.slug}?kiosk=1`}
              target="_blank"
              className="text-sm text-brand-primary hover:underline"
            >
              Open →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
