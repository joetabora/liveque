"use client";

import { parsePromotionVideoUrl } from "@/lib/promotion-video";

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

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden">
      {videoEmbed ? (
        <iframe
          src={videoEmbed.embedUrl}
          title={title}
          className="absolute inset-0 w-full h-full border-0 bg-black"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-iron-panel text-gray-500">
          No media configured
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 p-8 pointer-events-none">
        <h3 className="text-3xl font-black text-white">{title}</h3>
        {subtitle && <p className="mt-2 text-xl text-gray-200">{subtitle}</p>}
      </div>
    </div>
  );
}
