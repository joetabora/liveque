"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useDisplayFullscreen } from "@/hooks/useDisplayFullscreen";
import { DisplayFullscreenPrompt } from "@/components/queue/DisplayFullscreenPrompt";
import {
  MediaPortraitPlayer,
  YouTubeNativePlaylist,
} from "@/components/queue/MediaPortraitPlayer";
import { parsePromotionVideoUrl } from "@/lib/promotion-video";
import type { MediaPlaylistItem } from "@/lib/media-playlist-types";

interface MediaPortraitDisplayBoardProps {
  slug: string;
  kiosk?: boolean;
  initialPlaylist?: MediaPlaylistItem[];
}

const PROMO_REFETCH_MS = 30000;

export default function MediaPortraitDisplayBoard({
  slug,
  kiosk = false,
  initialPlaylist = [],
}: MediaPortraitDisplayBoardProps) {
  const { tenant } = useTenant();
  const brandColor = tenant?.brandColor ?? "#0065a6";
  const containerRef = useRef<HTMLDivElement>(null);
  const [promotions, setPromotions] =
    useState<MediaPlaylistItem[]>(initialPlaylist);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setPromotions(initialPlaylist);
    setIndex((prev) =>
      initialPlaylist.length === 0
        ? 0
        : Math.min(prev, initialPlaylist.length - 1)
    );
  }, [initialPlaylist]);

  const fetchPromotions = useCallback(async () => {
    try {
      const res = await fetch(`/api/tenants/${slug}/promotions`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data: MediaPlaylistItem[] = await res.json();
      if (!Array.isArray(data)) return;
      const videos = data.flatMap((promo) => {
        const videoUrl = promo.videoUrl?.trim() ?? "";
        if (!videoUrl || !parsePromotionVideoUrl(videoUrl, { loop: false })) {
          return [];
        }
        return [
          {
            id: promo.id,
            title: promo.title,
            subtitle: promo.subtitle,
            imageUrl: promo.imageUrl,
            videoUrl,
            sortOrder: promo.sortOrder ?? 0,
            isActive: promo.isActive ?? true,
          },
        ];
      });
      setPromotions((prev) => {
        // Never wipe a known-good SSR playlist because of a flaky client fetch
        if (videos.length === 0 && prev.length > 0) return prev;
        return videos;
      });
      setIndex((prev) =>
        videos.length === 0 ? 0 : Math.min(prev, Math.max(videos.length - 1, 0))
      );
    } catch {
      // Keep SSR / last good playlist
    }
  }, [slug]);

  useEffect(() => {
    const interval = setInterval(fetchPromotions, PROMO_REFETCH_MS);
    return () => clearInterval(interval);
  }, [fetchPromotions]);

  const playlistMeta = useMemo(() => {
    return promotions.map((promo) => ({
      promo,
      embed: parsePromotionVideoUrl(promo.videoUrl, { loop: false })!,
    }));
  }, [promotions]);

  const allYouTube =
    playlistMeta.length > 0 &&
    playlistMeta.every((item) => item.embed.provider === "youtube");

  const allTikTok =
    playlistMeta.length > 0 &&
    playlistMeta.every((item) => item.embed.provider === "tiktok");

  const youtubeIds = useMemo(
    () => (allYouTube ? playlistMeta.map((item) => item.embed.videoId) : []),
    [allYouTube, playlistMeta]
  );

  const current = promotions[index] ?? null;
  const currentProvider = current?.videoUrl
    ? parsePromotionVideoUrl(current.videoUrl, { loop: false })?.provider
    : null;
  const playbackKey = current ? `${current.id}-${index}` : "empty";

  const playerKey =
    currentProvider === "youtube"
      ? "youtube-engine"
      : currentProvider === "tiktok" || allTikTok
        ? "tiktok-engine"
        : playbackKey;

  const advance = useCallback(() => {
    setIndex((prev) => {
      if (promotions.length === 0) return 0;
      return (prev + 1) % promotions.length;
    });
  }, [promotions.length]);

  const { toggleFullscreen, showPrompt, dismissPrompt } = useDisplayFullscreen(
    containerRef,
    { kiosk }
  );

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen bg-black relative overflow-hidden"
      style={
        {
          "--brand-primary": brandColor,
        } as React.CSSProperties
      }
    >
      <DisplayFullscreenPrompt
        show={showPrompt}
        onActivate={dismissPrompt}
        brandColor={brandColor}
      />

      {!kiosk && (
        <button
          type="button"
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-black/50 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          title="Toggle Fullscreen"
        >
          ⛶
        </button>
      )}

      {/* Always-visible count so we can verify the full playlist loaded */}
      {promotions.length > 0 && (
        <div className="absolute top-4 left-4 z-20 rounded-lg bg-black/60 px-3 py-1.5 text-sm text-white pointer-events-none">
          {index + 1} / {promotions.length}
        </div>
      )}

      {promotions.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
          <p className="text-2xl font-bold text-white">Media Portrait</p>
          <p className="mt-4 text-lg text-gray-400 max-w-md">
            Add TikTok links under Media to play here.
          </p>
        </div>
      ) : allYouTube ? (
        <YouTubeNativePlaylist
          videoIds={youtubeIds}
          title="Media Portrait playlist"
        />
      ) : current?.videoUrl ? (
        <div className="absolute inset-0">
          <MediaPortraitPlayer
            key={playerKey}
            title={current.title}
            videoUrl={current.videoUrl}
            playbackKey={playbackKey}
            onEnded={advance}
          />
        </div>
      ) : null}

      {!allYouTube && promotions.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-2 pointer-events-none">
          {promotions.map((promo, i) => (
            <span
              key={promo.id}
              className={`w-2.5 h-2.5 rounded-full ${
                i === index ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
