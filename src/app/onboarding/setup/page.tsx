"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/AppShell";
import { IronQueueLogo } from "@/components/IronQueueLogo";
import { useToast } from "@/components/ui/Toast";

function OnboardingSetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const slug =
    searchParams.get("slug") ??
    sessionStorage.getItem("onboardingTenantSlug") ??
    "";

  const [loading, setLoading] = useState(!!slug);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    brandColor: "#0065a6",
    accentColor: "#004f85",
    welcomeMessage: "Welcome To",
    displayHeadline: "Today's Appointments",
  });

  useEffect(() => {
    if (!slug) return;
    sessionStorage.setItem("onboardingTenantSlug", slug);
    fetch(`/api/tenants/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name ?? "",
          brandColor: data.brandColor ?? "#0065a6",
          accentColor: data.accentColor ?? "#004f85",
          welcomeMessage: data.welcomeMessage ?? "Welcome To",
          displayHeadline: data.displayHeadline ?? "Today's Appointments",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    setSaving(true);

    const res = await fetch(`/api/tenants/${slug}/settings/branding`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      toast(data.error ?? "Failed to save branding", "error");
      return;
    }

    router.push(`/${slug}/admin`);
  };

  if (!slug) {
    return (
      <div className="bg-iron-panel border border-iron-border rounded-2xl p-6 text-center">
        <p className="text-gray-400">Missing business context. Start from onboarding.</p>
        <Link href="/onboarding" className="inline-block mt-4 text-brand-primary hover:underline">
          Create your business
        </Link>
      </div>
    );
  }

  const displayUrl = `/${slug}/display/main?kiosk=1`;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-4 bg-iron-panel border border-iron-border rounded-2xl p-6">
        {loading ? (
          <div className="h-40 animate-pulse bg-iron-dark rounded-xl" />
        ) : (
          <>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Business name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-2.5 text-white"
                required
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Brand color</label>
                <input
                  type="color"
                  value={form.brandColor}
                  onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
                  className="w-full h-11 bg-iron-dark border border-iron-border rounded-xl cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Accent color</label>
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  className="w-full h-11 bg-iron-dark border border-iron-border rounded-xl cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Welcome message</label>
              <input
                type="text"
                value={form.welcomeMessage}
                onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
                className="w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Display headline</label>
              <input
                type="text"
                value={form.displayHeadline}
                onChange={(e) => setForm({ ...form, displayHeadline: e.target.value })}
                className="w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-2.5 text-white"
              />
            </div>
          </>
        )}

        <Button type="submit" className="w-full" loading={saving} disabled={loading}>
          Save & Open Queue
        </Button>
      </form>

      <div className="bg-iron-panel border border-iron-border rounded-2xl p-6 space-y-3">
        <h3 className="text-lg font-bold text-white">Step 4 of 4 — Launch your display</h3>
        <p className="text-sm text-gray-400">
          Open this URL on your TV browser. Add <code className="text-gray-300">?kiosk=1</code> for
          fullscreen kiosk mode.
        </p>
        <code className="block text-sm text-brand-primary bg-iron-dark rounded-lg px-3 py-2 break-all">
          {typeof window !== "undefined" ? window.location.origin : ""}
          {displayUrl}
        </code>
        <div className="flex flex-wrap gap-3">
          <a href={displayUrl} target="_blank" rel="noreferrer">
            <Button variant="secondary">Open Display</Button>
          </a>
          <Link href={`/${slug}/checkin`} target="_blank">
            <Button variant="ghost">Open Check-in Page</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingSetupPage() {
  return (
    <div className="min-h-screen bg-iron-black">
      <div className="max-w-lg mx-auto px-4 py-12">
        <IronQueueLogo size="sm" />
        <PageHeader
          title="Configure your display"
          description="Step 3 of 4 — branding and launch"
        />
        <Suspense fallback={<div className="h-64 bg-iron-panel rounded-2xl animate-pulse" />}>
          <OnboardingSetupForm />
        </Suspense>
      </div>
    </div>
  );
}
