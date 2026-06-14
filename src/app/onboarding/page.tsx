"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/AppShell";
import { IronQueueLogo } from "@/components/IronQueueLogo";

export default function OnboardingBusinessPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const generateSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/onboarding/tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to create business");
      return;
    }

    sessionStorage.setItem("onboardingTenantId", data.tenant.id);
    sessionStorage.setItem("onboardingTenantSlug", data.tenant.slug);
    router.push("/onboarding/plan");
  };

  return (
    <div className="min-h-screen bg-iron-black">
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="mb-8">
          <IronQueueLogo size="sm" />
        </div>
        <PageHeader
          title="Create your business"
          description="Step 1 of 4 — set up your queue in under 10 minutes"
        />

        <form onSubmit={handleSubmit} className="space-y-4 bg-iron-panel border border-iron-border rounded-2xl p-6">
          {error && <p className="text-sm text-red-400">{error}</p>}

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Business name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Bella Salon"
              className="w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-2.5 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">URL slug</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">liveque.com/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="flex-1 bg-iron-dark border border-iron-border rounded-xl px-4 py-2.5 text-white"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
