export type PromotionVideoProvider = "youtube" | "tiktok";

export interface PromotionVideoEmbed {
  provider: PromotionVideoProvider;
  videoId: string;
  embedUrl: string;
}

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?.*v=|youtube\.com\/watch\?v=)([\w-]{11})/,
  /youtu\.be\/([\w-]{11})/,
  /youtube\.com\/shorts\/([\w-]{11})/,
  /youtube\.com\/embed\/([\w-]{11})/,
];

const TIKTOK_PATTERN = /tiktok\.com\/(?:@[\w.-]+\/video\/|embed\/v2\/)(\d+)/;

export function parsePromotionVideoUrl(url: string): PromotionVideoEmbed | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) return null;

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      const videoId = match[1];
      const params = new URLSearchParams({
        autoplay: "1",
        mute: "1",
        controls: "0",
        rel: "0",
        modestbranding: "1",
        playsinline: "1",
        loop: "1",
        playlist: videoId,
      });
      return {
        provider: "youtube",
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}?${params.toString()}`,
      };
    }
  }

  const tiktokMatch = trimmed.match(TIKTOK_PATTERN);
  if (tiktokMatch?.[1]) {
    const videoId = tiktokMatch[1];
    return {
      provider: "tiktok",
      videoId,
      embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
    };
  }

  return null;
}

export function getPromotionPreviewImage(
  imageUrl: string | null | undefined,
  videoUrl: string | null | undefined
): string | null {
  if (imageUrl?.trim()) return imageUrl.trim();

  const embed = videoUrl ? parsePromotionVideoUrl(videoUrl) : null;
  if (embed?.provider === "youtube") {
    return `https://img.youtube.com/vi/${embed.videoId}/hqdefault.jpg`;
  }

  return null;
}
