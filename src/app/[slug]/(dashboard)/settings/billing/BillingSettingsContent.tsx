"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

type BillingData = {
  tenant: {
    name: string;
    planTier: string;
    subscriptionStatus: string;
    trialEndsAt: string | null;
  };
  subscription: {
    status: string;
    planTier: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
    staffLimit: number | null;
    displayLimit: number | null;
  } | null;
  amountCents: number | null;
};

function formatPlan(tier: string) {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BillingSettingsContent() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tenants/${slug}/billing`)
      .then((r) => r.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast("Subscription activated", "success");
    }
  }, [searchParams, toast]);

  const openPortal = async () => {
    const res = await fetch(`/api/tenants/${slug}/billing/portal`, { method: "POST" });
    const json = await res.json();
    if (json.url) {
      window.location.href = json.url;
      return;
    }
    toast(json.error ?? "Could not open billing portal", "error");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-iron-panel rounded animate-pulse" />
        <div className="h-40 bg-iron-panel rounded-xl animate-pulse" />
      </div>
    );
  }

  const status = data?.tenant.subscriptionStatus ?? "unknown";
  const planTier = data?.subscription?.planTier ?? data?.tenant.planTier ?? "starter";
  const price =
    data?.amountCents != null ? `$${(data.amountCents / 100).toFixed(0)}/mo` : "Custom";

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Manage your subscription and payment methods"
        action={<Button onClick={openPortal}>Manage in Stripe</Button>}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-iron-panel border border-iron-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Current plan</h3>
            <Badge variant={status === "active" || status === "trialing" ? "green" : "orange"}>
              {status}
            </Badge>
          </div>
          <p className="text-3xl font-black text-white">{formatPlan(planTier)}</p>
          <p className="text-gray-400">{price}</p>
          {data?.tenant.trialEndsAt && status === "trialing" && (
            <p className="text-sm text-gray-500">
              Trial ends {formatDate(data.tenant.trialEndsAt)}
            </p>
          )}
          {data?.subscription?.cancelAtPeriodEnd && (
            <p className="text-sm text-amber-400">
              Cancels at end of period ({formatDate(data.subscription.currentPeriodEnd)})
            </p>
          )}
        </div>

        <div className="bg-iron-panel border border-iron-border rounded-xl p-6 space-y-3">
          <h3 className="text-lg font-bold text-white">Plan limits</h3>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>Staff users: {data?.subscription?.staffLimit ?? "Unlimited"}</li>
            <li>Displays: {data?.subscription?.displayLimit ?? "Unlimited"}</li>
            <li>Next billing date: {formatDate(data?.subscription?.currentPeriodEnd ?? null)}</li>
          </ul>
          <p className="text-sm text-gray-500 pt-2">
            Upgrade, downgrade, or update payment methods in the Stripe customer portal.
          </p>
        </div>
      </div>

      {searchParams.get("success") === "1" && (
        <div className="mt-6 bg-iron-panel border border-brand-primary/30 rounded-xl p-6">
          <p className="text-white font-medium">Payment setup complete.</p>
          <p className="text-gray-400 text-sm mt-1">
            Finish configuring your display to go live.
          </p>
          <Link
            href={`/onboarding/setup?slug=${slug}`}
            className="inline-block mt-4 text-brand-primary hover:underline"
          >
            Continue setup →
          </Link>
        </div>
      )}
    </div>
  );
}
