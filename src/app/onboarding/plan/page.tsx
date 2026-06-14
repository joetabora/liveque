"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/AppShell";
import { IronQueueLogo } from "@/components/IronQueueLogo";

const plans = [
  {
    tier: "starter" as const,
    name: "Starter",
    price: "$49",
    features: ["1 location", "1 display", "3 staff users"],
  },
  {
    tier: "professional" as const,
    name: "Professional",
    price: "$99",
    features: ["Unlimited displays", "Unlimited staff", "Analytics"],
    popular: true,
  },
];

export default function OnboardingPlanPage() {
  const router = useRouter();

  const handleSelect = async (planTier: "starter" | "professional") => {
    const tenantId = sessionStorage.getItem("onboardingTenantId");
    const slug = sessionStorage.getItem("onboardingTenantSlug");

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planTier, tenantId }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
      return;
    }

    if (slug) {
      router.push(`/${slug}/admin`);
    }
  };

  return (
    <div className="min-h-screen bg-iron-black">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <IronQueueLogo size="sm" />
        <PageHeader
          title="Choose your plan"
          description="Step 2 of 4 — 14-day free trial included"
        />

        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`bg-iron-panel border rounded-2xl p-6 ${
                plan.popular ? "border-brand-primary" : "border-iron-border"
              }`}
            >
              {plan.popular && (
                <span className="text-xs font-bold uppercase text-brand-primary tracking-wider">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold mt-2">{plan.name}</h3>
              <p className="text-3xl font-black mt-2">
                {plan.price}
                <span className="text-sm font-normal text-gray-500">/mo</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-400">
                {plan.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <Button
                className="w-full mt-6"
                variant={plan.popular ? "primary" : "secondary"}
                onClick={() => handleSelect(plan.tier)}
              >
                Start Free Trial
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
