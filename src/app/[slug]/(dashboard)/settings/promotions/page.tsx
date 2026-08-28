"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface Promotion {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm = {
  title: "",
  subtitle: "",
  imageUrl: "",
  isActive: true,
};

export default function PromotionsSettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadPromotions = useCallback(async () => {
    const res = await fetch(`/api/tenants/${slug}/promotions?includeInactive=1`);
    if (!res.ok) {
      toast("Failed to load promotions", "error");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setPromotions(data);
    setLoading(false);
  }, [slug, toast]);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.imageUrl.trim()) {
      toast("Title and image URL are required", "error");
      return;
    }

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      imageUrl: form.imageUrl.trim(),
      isActive: form.isActive,
    };

    const res = editingId
      ? await fetch(`/api/tenants/${slug}/promotions/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch(`/api/tenants/${slug}/promotions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    setSaving(false);

    if (res.ok) {
      toast(editingId ? "Promotion updated" : "Promotion added", "success");
      resetForm();
      await loadPromotions();
    } else {
      toast("Failed to save promotion", "error");
    }
  };

  const startEdit = (promo: Promotion) => {
    setEditingId(promo.id);
    setForm({
      title: promo.title,
      subtitle: promo.subtitle ?? "",
      imageUrl: promo.imageUrl,
      isActive: promo.isActive,
    });
  };

  const toggleActive = async (promo: Promotion) => {
    const res = await fetch(`/api/tenants/${slug}/promotions/${promo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !promo.isActive }),
    });
    if (res.ok) {
      await loadPromotions();
    } else {
      toast("Failed to update promotion", "error");
    }
  };

  const deletePromotion = async (promo: Promotion) => {
    if (!confirm(`Delete "${promo.title}"?`)) return;
    const res = await fetch(`/api/tenants/${slug}/promotions/${promo.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast("Promotion deleted", "success");
      if (editingId === promo.id) resetForm();
      await loadPromotions();
    } else {
      toast("Failed to delete promotion", "error");
    }
  };

  const movePromotion = async (promo: Promotion, direction: "up" | "down") => {
    const index = promotions.findIndex((p) => p.id === promo.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= promotions.length) return;

    const other = promotions[swapIndex];
    await Promise.all([
      fetch(`/api/tenants/${slug}/promotions/${promo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: other.sortOrder }),
      }),
      fetch(`/api/tenants/${slug}/promotions/${other.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: promo.sortOrder }),
      }),
    ]);
    await loadPromotions();
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-iron-panel rounded-xl" />;
  }

  return (
    <div>
      <PageHeader
        title="Promotions"
        description="Manage event and in-store ads shown on the portrait kiosk display"
      />

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4 mb-10">
        <h2 className="text-lg font-semibold text-white">
          {editingId ? "Edit promotion" : "Add promotion"}
        </h2>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-2.5 text-white"
            placeholder="Spring Open House"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">
            Subtitle (optional)
          </label>
          <input
            type="text"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            className="w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-2.5 text-white"
            placeholder="Saturday, March 15 — Free BBQ & live music"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Image URL</label>
          <input
            type="url"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className="w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-2.5 text-white"
            placeholder="https://example.com/promo.jpg"
          />
        </div>
        {form.imageUrl && (
          <div className="rounded-xl overflow-hidden border border-iron-border aspect-video max-w-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.imageUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="rounded"
          />
          Show on portrait display
        </label>
        <div className="flex gap-3">
          <Button type="submit" loading={saving}>
            {editingId ? "Save changes" : "Add promotion"}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Current promotions</h2>
        {promotions.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No promotions yet. Add one above to show on the portrait kiosk.
          </p>
        ) : (
          promotions.map((promo, index) => (
            <div
              key={promo.id}
              className="bg-iron-panel border border-iron-border rounded-xl p-4 flex gap-4 items-start"
            >
              <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-iron-dark">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={promo.imageUrl}
                  alt={promo.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white truncate">{promo.title}</p>
                  {!promo.isActive && (
                    <span className="text-xs uppercase tracking-wide text-gray-500">
                      Hidden
                    </span>
                  )}
                </div>
                {promo.subtitle && (
                  <p className="text-sm text-gray-400 mt-0.5 truncate">
                    {promo.subtitle}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => movePromotion(promo, "up")}
                  disabled={index === 0}
                  className="text-xs text-gray-400 hover:text-white disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => movePromotion(promo, "down")}
                  disabled={index === promotions.length - 1}
                  className="text-xs text-gray-400 hover:text-white disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(promo)}
                  className="text-sm text-brand-primary hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(promo)}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  {promo.isActive ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  onClick={() => deletePromotion(promo)}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
