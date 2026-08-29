"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  getPromotionPreviewImage,
  parsePromotionVideoUrl,
} from "@/lib/promotion-video";
import { PromotionCarouselMedia } from "@/components/queue/PromotionCarouselMedia";
import { APP_URL } from "@/lib/constants";

interface MediaItem {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm = {
  title: "",
  subtitle: "",
  videoUrl: "",
  isActive: true,
};

export default function MediaSettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const mediaItems = useMemo(
    () => items.filter((item) => !!item.videoUrl?.trim()),
    [items]
  );

  const kioskUrl = `${APP_URL}/${slug}/display/media-portrait?kiosk=1`;

  const loadItems = useCallback(async () => {
    const res = await fetch(`/api/tenants/${slug}/promotions?includeInactive=1`);
    if (!res.ok) {
      toast("Failed to load media", "error");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }, [slug, toast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast("Title is required", "error");
      return;
    }
    if (!form.videoUrl.trim()) {
      toast("Video URL is required", "error");
      return;
    }
    if (!parsePromotionVideoUrl(form.videoUrl.trim())) {
      toast(
        "Use a supported YouTube, TikTok, Facebook, or Instagram URL",
        "error"
      );
      return;
    }

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      videoUrl: form.videoUrl.trim(),
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
      toast(editingId ? "Media updated" : "Media added", "success");
      resetForm();
      await loadItems();
    } else {
      const data = await res.json().catch(() => ({}));
      toast(data.error ?? "Failed to save media", "error");
    }
  };

  const startEdit = (item: MediaItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      subtitle: item.subtitle ?? "",
      videoUrl: item.videoUrl ?? "",
      isActive: item.isActive,
    });
  };

  const toggleActive = async (item: MediaItem) => {
    const res = await fetch(`/api/tenants/${slug}/promotions/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    if (res.ok) {
      await loadItems();
    } else {
      toast("Failed to update media", "error");
    }
  };

  const deleteItem = async (item: MediaItem) => {
    if (!confirm(`Remove "${item.title}" from the Media Portrait playlist?`)) {
      return;
    }
    const res = await fetch(`/api/tenants/${slug}/promotions/${item.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast("Media removed", "success");
      if (editingId === item.id) resetForm();
      await loadItems();
    } else {
      toast("Failed to delete media", "error");
    }
  };

  const moveItem = async (item: MediaItem, direction: "up" | "down") => {
    const index = mediaItems.findIndex((p) => p.id === item.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= mediaItems.length) return;

    const other = mediaItems[swapIndex];
    await Promise.all([
      fetch(`/api/tenants/${slug}/promotions/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: other.sortOrder }),
      }),
      fetch(`/api/tenants/${slug}/promotions/${other.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: item.sortOrder }),
      }),
    ]);
    await loadItems();
  };

  const previewVideo = form.videoUrl.trim()
    ? parsePromotionVideoUrl(form.videoUrl.trim())
    : null;

  if (loading) {
    return <div className="animate-pulse h-64 bg-iron-panel rounded-xl" />;
  }

  return (
    <div>
      <PageHeader
        title="Media"
        description="Video playlist for the Media Portrait display"
        action={
          <a
            href={`/${slug}/display/media-portrait?kiosk=1`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-brand-primary hover:underline"
          >
            Open Media Portrait →
          </a>
        }
      />

      <p className="text-sm text-gray-500 mb-8 max-w-xl">
        Add YouTube Shorts, TikTok, Facebook, or Instagram video links. They
        play fullscreen and advance when each clip finishes. Videos autoplay
        muted. Kiosk URL:{" "}
        <span className="text-gray-400 break-all">{kioskUrl}</span>
      </p>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4 mb-10">
        <h2 className="text-lg font-semibold text-white">
          {editingId ? "Edit media" : "Add media"}
        </h2>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-2.5 text-white"
            placeholder="New bike reveal"
            required
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
            placeholder="Shown in admin list only"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Video URL</label>
          <input
            type="url"
            value={form.videoUrl}
            onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
            className="w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-2.5 text-white"
            placeholder="https://www.youtube.com/shorts/..."
            required
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Use the full video URL — not short share links (e.g. vm.tiktok.com).
          </p>
        </div>
        {previewVideo && (
          <div className="rounded-xl overflow-hidden border border-iron-border aspect-[9/16] max-w-xs bg-black">
            <PromotionCarouselMedia
              title={form.title || "Preview"}
              subtitle={form.subtitle || null}
              videoUrl={form.videoUrl}
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
          Show on Media Portrait
        </label>
        <div className="flex gap-3">
          <Button type="submit" loading={saving}>
            {editingId ? "Save changes" : "Add to playlist"}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Playlist</h2>
        {mediaItems.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No videos yet. Add a link above to start the Media Portrait playlist.
          </p>
        ) : (
          mediaItems.map((item, index) => {
            const thumb = getPromotionPreviewImage(item.imageUrl, item.videoUrl);
            const provider = item.videoUrl
              ? parsePromotionVideoUrl(item.videoUrl)?.provider
              : null;

            return (
              <div
                key={item.id}
                className="bg-iron-panel border border-iron-border rounded-xl p-4 flex gap-4 items-start"
              >
                <div className="w-16 h-28 rounded-lg overflow-hidden flex-shrink-0 bg-black flex items-center justify-center">
                  {thumb ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={thumb}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide px-1 text-center">
                      {provider ?? "Video"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white truncate">{item.title}</p>
                    {provider && (
                      <span className="text-xs uppercase tracking-wide text-brand-primary">
                        {provider}
                      </span>
                    )}
                    {!item.isActive && (
                      <span className="text-xs uppercase tracking-wide text-gray-500">
                        Hidden
                      </span>
                    )}
                  </div>
                  {item.subtitle && (
                    <p className="text-sm text-gray-400 mt-0.5 truncate">
                      {item.subtitle}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {item.videoUrl}
                  </p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => moveItem(item, "up")}
                    disabled={index === 0}
                    className="text-xs text-gray-400 hover:text-white disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(item, "down")}
                    disabled={index === mediaItems.length - 1}
                    className="text-xs text-gray-400 hover:text-white disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="text-sm text-brand-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(item)}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    {item.isActive ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
