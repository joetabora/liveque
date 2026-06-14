"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface Member {
  membership: { role: string };
  user: { name: string | null; email: string };
}

export default function TeamSettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"staff" | "owner">("staff");
  const [loading, setLoading] = useState(false);

  const loadMembers = () => {
    fetch(`/api/tenants/${slug}/team`)
      .then((r) => r.json())
      .then(setMembers);
  };

  useEffect(() => {
    loadMembers();
  }, [slug]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/tenants/${slug}/team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    setLoading(false);
    if (res.ok) {
      toast("Member invited", "success");
      setEmail("");
      loadMembers();
    } else {
      const data = await res.json();
      toast(data.error ?? "Invite failed", "error");
    }
  };

  return (
    <div>
      <PageHeader title="Team" description="Manage staff access and roles" />
      <form onSubmit={handleInvite} className="max-w-md flex gap-3 mb-8">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="staff@example.com"
          className="flex-1 bg-iron-dark border border-iron-border rounded-xl px-4 py-2 text-white"
          required
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "staff" | "owner")}
          className="bg-iron-dark border border-iron-border rounded-xl px-3 text-white"
        >
          <option value="staff">Staff</option>
          <option value="owner">Owner</option>
        </select>
        <Button type="submit" loading={loading}>Invite</Button>
      </form>
      <div className="space-y-2">
        {members.map((m, i) => (
          <div key={i} className="bg-iron-panel border border-iron-border rounded-xl px-4 py-3 flex justify-between">
            <div>
              <p className="font-medium">{m.user.name ?? m.user.email}</p>
              <p className="text-sm text-gray-500">{m.user.email}</p>
            </div>
            <span className="text-xs uppercase tracking-wider text-gray-500">{m.membership.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
