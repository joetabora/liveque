"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/AppShell";
import { IronQueueLogo } from "@/components/IronQueueLogo";

export default function PlatformDashboard() {
  const [data, setData] = useState<{
    tenants: Array<{
      id: string;
      slug: string;
      name: string;
      planTier: string;
      subscriptionStatus: string;
    }>;
    stats: {
      totalTenants: number;
      activeTenants: number;
      mrr: number;
      newThisMonth: number;
    };
  } | null>(null);

  useEffect(() => {
    fetch("/api/platform/tenants")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <div className="min-h-screen bg-iron-black p-6 lg:p-8">
      <IronQueueLogo size="sm" />
      <PageHeader title="Platform Admin" description="Tenant and revenue overview" />

      {data?.stats && (
        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Tenants" value={data.stats.totalTenants} />
          <StatCard label="Active" value={data.stats.activeTenants} />
          <StatCard label="MRR" value={`$${data.stats.mrr}`} />
          <StatCard label="New This Month" value={data.stats.newThisMonth} />
        </div>
      )}

      <div className="bg-iron-panel border border-iron-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-iron-border text-gray-500 text-left">
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {data?.tenants.map((t) => (
              <tr key={t.id} className="border-b border-iron-border/50">
                <td className="px-4 py-3">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-gray-500">{t.slug}</p>
                </td>
                <td className="px-4 py-3 capitalize">{t.planTier}</td>
                <td className="px-4 py-3 capitalize">{t.subscriptionStatus}</td>
                <td className="px-4 py-3">
                  <Link href={`/${t.slug}/admin`} className="text-brand-primary hover:underline">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-iron-panel border border-iron-border rounded-xl p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );
}
