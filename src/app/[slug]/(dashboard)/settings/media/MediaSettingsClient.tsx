"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  getPromotionPreviewImage,
  parsePromotionVideoUrl,
} from "@/lib/promotion-video";
import { PromotionCarouselMedia } from "@/components/queue/PromotionCarouselMedia";
import type { MediaAdminItem } from "@/lib/media-playlist-types";

export type MediaItem = MediaAdminItem;

const emptyForm = {
  title: "",
  subtitle: "",
  videoUrl: "",
  isActive: true,
};

export default function MediaSettingsClient({
  slug,
  initialItems,
}: {
  slug: string;
  initialItems: MediaItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [host, setHost] = useState("");

  // Always render from server props — avoids client state drifting on kiosk browsers
  const mediaItems = useMemo(
    () => initialItems.filter((item) => !!item.videoUrl?.trim()),
    [initialItems]
  );

  useEffect(() => {
    setHost(window.location.host);
  }, []);

  const refresh = () => {
    router.refresh();
  };

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
          credentials: "include",
          body: JSON.stringify(payload),
        })
      : await fetch(`/api/tenants/${slug}/promotions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

    setSaving(false);

    if (res.ok) {
      toast(editingId ? "Media updated" : "Media added", "success");
      resetForm();
      refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast(
        data.error ??
          "Failed to save media — sign in as staff on this device to edit",
        "error"
      );
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleActive = async (item: MediaItem) => {
    const res = await fetch(`/api/tenants/${slug}/promotions/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    if (res.ok) {
      refresh();
    } else {
      toast(
        "Failed to update — sign in as staff on this device to edit the playlist",
        "error"
      );
    }
  };

  const deleteItem = async (item: MediaItem) => {
    if (!confirm(`Remove "${item.title}" from the Media Portrait playlist?`)) {
      return;
    }
    const res = await fetch(`/api/tenants/${slug}/promotions/${item.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      toast("Media removed", "success");
      if (editingId === item.id) resetForm();
      refresh();
    } else {
      toast(
        "Failed to delete — sign in as staff on this device to edit the playlist",
        "error"
      );
    }
  };

  const moveItem = async (item: MediaItem, direction: "up" | "down") => {
    const index = mediaItems.findIndex((p) => p.id === item.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= mediaItems.length) return;

    const other = mediaItems[swapIndex];
    const results = await Promise.all([
      fetch(`/api/tenants/${slug}/promotions/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sortOrder: other.sortOrder }),
      }),
      fetch(`/api/tenants/${slug}/promotions/${other.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sortOrder: item.sortOrder }),
      }),
    ]);
    if (results.every((r) => r.ok)) {
      refresh();
    } else {
      toast(
        "Failed to reorder — sign in as staff on this device to edit the playlist",
        "error"
      );
    }
  };

  const previewVideo = form.videoUrl.trim()
    ? parsePromotionVideoUrl(form.videoUrl.trim())
    : null;

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

      <div className="mb-4 rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-4 py-3">
        <p className="text-lg font-bold text-white">
          {mediaItems.length} video{mediaItems.length === 1 ? "" : "s"} in
          playlist
        </p>
        <p className="text-sm text-gray-300 mt-1">
          {mediaItems.length > 0
            ? mediaItems.map((item) => item.title).join(" · ")
            : "No TikTok/YouTube links saved yet."}
        </p>
        {host && (
          <p className="text-xs text-gray-500 mt-2">
            Site: <span className="text-gray-300">{host}</span>
            {host !== "liveque.vercel.app" && (
              <span className="text-amber-400">
                {" "}
                — use liveque.vercel.app on the kiosk for production data
              </span>
            )}
          </p>
        )}
      </div>

      <div className="space-y-3 mb-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">Playlist</h2>
          <Button type="button" variant="ghost" onClick={refresh}>
            Refresh
          </Button>
        </div>

        {mediaItems.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No videos yet. Add a TikTok link below.
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
                <div className="w-8 flex-shrink-0 text-gray-500 font-bold text-lg pt-1">
                  {index + 1}
                </div>
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
                  <p className="text-xs text-gray-600 mt-1 break-all">
                    {item.videoUrl}
                  </p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => moveItem(item, "up")}
                    disabled={index === 0}
                    className="text-xs text-gray-400 hover:text-white disabled:opacity-30 p-2"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(item, "down")}
                    disabled={index === mediaItems.length - 1}
                    className="text-xs text-gray-400 hover:text-white disabled:opacity-30 p-2"
                  >
                    ↓
                  </button>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="text-sm text-brand-primary hover:underline p-1"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(item)}
                    className="text-sm text-gray-400 hover:text-white p-1"
                  >
                    {item.isActive ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item)}
                    className="text-sm text-red-400 hover:text-red-300 p-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
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
            placeholder="https://www.tiktok.com/@.../video/..."
            required
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Use the full TikTok URL — not short share links (e.g. vm.tiktok.com).
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
    </div>
  );
}
