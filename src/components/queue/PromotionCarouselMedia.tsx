"use client";

import { useMemo } from "react";
import {
  buildPromotionEmbedSrc,
  parsePromotionVideoUrl,
} from "@/lib/promotion-video";

interface PromotionCarouselMediaProps {
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
}

export function PromotionCarouselMedia({
  title,
  subtitle,
  imageUrl,
  videoUrl,
}: PromotionCarouselMediaProps) {
  const videoEmbed = videoUrl ? parsePromotionVideoUrl(videoUrl) : null;

  const embedSrc = useMemo(() => {
    if (!videoUrl) return null;
    const embed = parsePromotionVideoUrl(videoUrl);
    if (!embed) return null;
    const origin =
      typeof window !== "undefined" ? window.location.origin : undefined;
    return buildPromotionEmbedSrc(embed, origin);
  }, [videoUrl]);

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden bg-black">
      {videoEmbed && embedSrc ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <iframe
            key={embedSrc}
            src={embedSrc}
            title={title}
            className="h-full w-full border-0 bg-black"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-gray-500">
          No media configured
        </div>
      )}
      <div
        className={`absolute inset-0 pointer-events-none ${
          videoEmbed
            ? "bg-gradient-to-t from-black/90 via-transparent to-transparent"
            : "bg-gradient-to-t from-black/80 via-black/20 to-transparent"
        }`}
      />
      <div className="absolute bottom-0 left-0 right-0 p-8 pointer-events-none">
        <h3 className="text-3xl font-black text-white">{title}</h3>
        {subtitle && <p className="mt-2 text-xl text-gray-200">{subtitle}</p>}
      </div>
    </div>
  );
}
