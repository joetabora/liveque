"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function BrandingSettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    logoUrl: "",
    brandColor: "#0065a6",
    accentColor: "#004f85",
    welcomeMessage: "Welcome To",
    displayHeadline: "Today's Appointments",
  });

  useEffect(() => {
    fetch(`/api/tenants/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name ?? "",
          logoUrl: data.logoUrl ?? "",
          brandColor: data.brandColor ?? "#0065a6",
          accentColor: data.accentColor ?? "#004f85",
          welcomeMessage: data.welcomeMessage ?? "Welcome To",
          displayHeadline: data.displayHeadline ?? "Today's Appointments",
        });
        setLoading(false);
      });
  }, [slug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/tenants/${slug}/settings/branding`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) toast("Branding saved", "success");
    else toast("Failed to save", "error");
  };

  if (loading) return <div className="animate-pulse h-64 bg-iron-panel rounded-xl" />;

  return (
    <div>
      <PageHeader title="Branding" description="Customize your display board appearance" />
      <form onSubmit={handleSave} className="max-w-xl space-y-4">
        {(["name", "logoUrl", "welcomeMessage", "displayHeadline"] as const).map((field) => (
          <div key={field}>
            <label className="block text-sm text-gray-400 mb-1.5 capitalize">{field.replace(/([A-Z])/g, " $1")}</label>
            <input
              type="text"
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-2.5 text-white"
            />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Brand color</label>
            <input type="color" value={form.brandColor} onChange={(e) => setForm({ ...form, brandColor: e.target.value })} className="w-full h-10 rounded-lg cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Accent color</label>
            <input type="color" value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} className="w-full h-10 rounded-lg cursor-pointer" />
          </div>
        </div>
        <Button type="submit" loading={saving}>Save Branding</Button>
      </form>
    </div>
  );
}
