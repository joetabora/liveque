"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";

export default function BillingSettingsPage() {
  const { slug } = useParams<{ slug: string }>();

  const openPortal = async () => {
    const res = await fetch(`/api/tenants/${slug}/billing/portal`, { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Manage your subscription and payment methods"
        action={<Button onClick={openPortal}>Manage Subscription</Button>}
      />
      <div className="bg-iron-panel border border-iron-border rounded-xl p-6">
        <p className="text-gray-400">
          Use the customer portal to update payment methods, change plans, or cancel your subscription.
        </p>
      </div>
    </div>
  );
}
