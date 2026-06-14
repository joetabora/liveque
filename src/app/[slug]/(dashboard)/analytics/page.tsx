"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/AppShell";

export default function AnalyticsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [stats, setStats] = useState<{
    appointmentsToday: number;
    completedToday: number;
    noShowRate: number;
    peakHours: Array<{ hour: number; count: number }>;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/tenants/${slug}/analytics`)
      .then((r) => r.json())
      .then(setStats);
  }, [slug]);

  if (!stats) {
    return <div className="animate-pulse h-64 bg-iron-panel rounded-xl" />;
  }

  return (
    <div>
      <PageHeader title="Analytics" description="Queue performance and traffic insights" />
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Appointments Today" value={stats.appointmentsToday} />
        <StatCard label="Completed Today" value={stats.completedToday} />
        <StatCard label="No-show Rate" value={`${stats.noShowRate}%`} />
      </div>
      <div className="bg-iron-panel border border-iron-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Peak Hours (7 days)</h3>
        {stats.peakHours.length === 0 ? (
          <p className="text-gray-500 text-sm">No data yet</p>
        ) : (
          <ul className="space-y-2">
            {stats.peakHours.map((h) => (
              <li key={h.hour} className="flex justify-between text-sm">
                <span className="text-gray-400">{formatHour(h.hour)}</span>
                <span>{h.count} check-ins</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-iron-panel border border-iron-border rounded-xl p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-black mt-2">{value}</p>
    </div>
  );
}

function formatHour(h: number) {
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:00 ${period}`;
}
