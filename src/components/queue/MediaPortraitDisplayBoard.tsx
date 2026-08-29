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

interface Promotion {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
}

interface MediaPortraitDisplayBoardProps {
  slug: string;
  kiosk?: boolean;
}

const PROMO_REFETCH_MS = 30000;

export default function MediaPortraitDisplayBoard({
  slug,
  kiosk = false,
}: MediaPortraitDisplayBoardProps) {
  const { tenant } = useTenant();
  const brandColor = tenant?.brandColor ?? "#0065a6";
  const containerRef = useRef<HTMLDivElement>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPromotions = useCallback(async () => {
    try {
      const res = await fetch(`/api/tenants/${slug}/promotions`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data: Promotion[] = await res.json();
      if (!Array.isArray(data)) return;
      const videos = data.filter(
        (promo) =>
          !!promo.videoUrl?.trim() &&
          !!parsePromotionVideoUrl(promo.videoUrl, { loop: false })
      );
      setPromotions(videos);
      setIndex((prev) =>
        videos.length === 0 ? 0 : Math.min(prev, videos.length - 1)
      );
    } catch {
      // Keep last good playlist if refetch fails
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPromotions();
    const interval = setInterval(fetchPromotions, PROMO_REFETCH_MS);
    return () => clearInterval(interval);
  }, [fetchPromotions]);

  const playlistMeta = useMemo(() => {
    return promotions.map((promo) => ({
      promo,
      embed: parsePromotionVideoUrl(promo.videoUrl!, { loop: false })!,
    }));
  }, [promotions]);

  const allYouTube =
    playlistMeta.length > 0 &&
    playlistMeta.every((item) => item.embed.provider === "youtube");

  const allTikTok =
    playlistMeta.length > 0 &&
    playlistMeta.every((item) => item.embed.provider === "tiktok");

  const youtubeIds = useMemo(
    () =>
      allYouTube ? playlistMeta.map((item) => item.embed.videoId) : [],
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

      {promotions.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
          <p className="text-2xl font-bold text-white">Media Portrait</p>
          <p className="mt-4 text-lg text-gray-400 max-w-md">
            Add TikTok (or YouTube) video links under Media to play here.
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
              className={`w-2 h-2 rounded-full ${
                i === index ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
