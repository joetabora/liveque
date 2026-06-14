"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";

function CheckInForm() {
  const { slug } = useParams<{ slug: string }>();
  const { tenant } = useTenant();
  const [name, setName] = useState("");
  const [hereToSee, setHereToSee] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/tenants/${slug}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, hereToSee: hereToSee || undefined }),
    });
    setLoading(false);
    if (res.ok) {
      setDone(true);
      setName("");
      setHereToSee("");
    }
  };

  const brandColor = tenant?.brandColor ?? "#0065a6";

  if (done) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold" style={{ color: brandColor }}>You&apos;re checked in!</h2>
        <p className="mt-2 text-gray-500">Please take a seat. We&apos;ll call your name shortly.</p>
        <Button className="mt-6" onClick={() => setDone(false)}>Check in another person</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Your name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-3 text-white text-lg"
          required
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Here to see (optional)</label>
        <input
          type="text"
          value={hereToSee}
          onChange={(e) => setHereToSee(e.target.value)}
          className="w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-3 text-white"
        />
      </div>
      <Button type="submit" className="w-full" size="lg" loading={loading}>
        Check In
      </Button>
    </form>
  );
}

export default function CheckInPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <TenantProvider slug={slug}>
      <div className="min-h-screen bg-iron-black flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-iron-panel border border-iron-border rounded-2xl p-6">
          <h1 className="text-xl font-bold mb-6 text-center">Check In</h1>
          <CheckInForm />
        </div>
      </div>
    </TenantProvider>
  );
}
