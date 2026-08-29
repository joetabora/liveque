export type PromotionVideoProvider =
  | "youtube"
  | "tiktok"
  | "facebook"
  | "instagram";

export interface PromotionVideoEmbed {
  provider: PromotionVideoProvider;
  videoId: string;
  /** Canonical page URL used for Meta embeds */
  sourceUrl: string;
  embedUrl: string;
}

export interface BuildEmbedOptions {
  /** When false, omit loop so the player can reach an ended state. Default true. */
  loop?: boolean;
  origin?: string;
}

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?.*v=|youtube\.com\/watch\?v=)([\w-]{11})/,
  /youtu\.be\/([\w-]{11})/,
  /youtube\.com\/shorts\/([\w-]{11})/,
  /youtube\.com\/embed\/([\w-]{11})/,
];

const TIKTOK_PATTERN = /tiktok\.com\/(?:@[\w.-]+\/video\/|embed\/v2\/)(\d+)/;

const INSTAGRAM_PATTERN =
  /instagram\.com\/(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/;

const FACEBOOK_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "fb.watch",
  "www.fb.watch",
]);

function buildYouTubeEmbed(videoId: string, loop: boolean): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    fs: "0",
    iv_load_policy: "3",
    disablekb: "1",
    enablejsapi: "1",
    start: "0",
  });

  if (loop) {
    params.set("loop", "1");
    params.set("playlist", videoId);
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

function buildTikTokEmbed(videoId: string, loop: boolean): string {
  const params = new URLSearchParams({
    autoplay: "1",
    muted: "1",
    loop: loop ? "1" : "0",
    controls: "0",
    description: "0",
    music_info: "0",
    timestamp: "0",
    fullscreen_button: "0",
    volume_control: "0",
  });
  return `https://www.tiktok.com/player/v1/${videoId}?${params.toString()}`;
}

function buildFacebookEmbed(sourceUrl: string): string {
  const params = new URLSearchParams({
    href: sourceUrl,
    show_text: "false",
    autoplay: "true",
    mute: "1",
    width: "1080",
    height: "1920",
  });
  return `https://www.facebook.com/plugins/video.php?${params.toString()}`;
}

function buildInstagramEmbed(kind: string, shortcode: string): string {
  const pathKind =
    kind === "reels" || kind === "reel" ? "reel" : kind === "tv" ? "tv" : "p";
  return `https://www.instagram.com/${pathKind}/${shortcode}/embed/`;
}

function isFacebookVideoUrl(parsed: URL, raw: string): boolean {
  const host = parsed.hostname.toLowerCase();
  if (!FACEBOOK_HOSTS.has(host) && !host.endsWith(".facebook.com")) {
    return false;
  }

  if (host === "fb.watch" || host === "www.fb.watch") return true;

  const path = parsed.pathname.toLowerCase();
  return (
    path.includes("/videos/") ||
    path.includes("/reel/") ||
    path.includes("/reels/") ||
    path.includes("/watch") ||
    path.includes("/share/v/") ||
    path.includes("/share/r/") ||
    parsed.searchParams.has("v") ||
    /facebook\.com\/.+\/videos\//.test(raw)
  );
}

export function parsePromotionVideoUrl(
  url: string,
  options: BuildEmbedOptions = {}
): PromotionVideoEmbed | null {
  const loop = options.loop !== false;
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
      return {
        provider: "youtube",
        videoId,
        sourceUrl: trimmed,
        embedUrl: buildYouTubeEmbed(videoId, loop),
      };
    }
  }

  const tiktokMatch = trimmed.match(TIKTOK_PATTERN);
  if (tiktokMatch?.[1]) {
    const videoId = tiktokMatch[1];
    return {
      provider: "tiktok",
      videoId,
      sourceUrl: trimmed,
      embedUrl: buildTikTokEmbed(videoId, loop),
    };
  }

  const instagramMatch = trimmed.match(INSTAGRAM_PATTERN);
  if (instagramMatch?.[1] && instagramMatch?.[2]) {
    const kind = instagramMatch[1];
    const videoId = instagramMatch[2];
    return {
      provider: "instagram",
      videoId,
      sourceUrl: trimmed,
      embedUrl: buildInstagramEmbed(kind, videoId),
    };
  }

  if (isFacebookVideoUrl(parsed, trimmed)) {
    const videoId =
      parsed.searchParams.get("v") ||
      trimmed.match(/\/(?:videos|reel|reels)\/(\d+)/)?.[1] ||
      parsed.pathname.replace(/\//g, "_");
    return {
      provider: "facebook",
      videoId,
      sourceUrl: trimmed,
      embedUrl: buildFacebookEmbed(trimmed),
    };
  }

  return null;
}

export function buildPromotionEmbedSrc(
  embed: PromotionVideoEmbed,
  originOrOptions?: string | BuildEmbedOptions
): string {
  const options: BuildEmbedOptions =
    typeof originOrOptions === "string"
      ? { origin: originOrOptions }
      : originOrOptions ?? {};

  const rebuilt = parsePromotionVideoUrl(embed.sourceUrl, {
    loop: options.loop,
  });
  const base = rebuilt?.embedUrl ?? embed.embedUrl;

  if (embed.provider === "youtube" && options.origin) {
    const url = new URL(base);
    url.searchParams.set("origin", options.origin);
    return url.toString();
  }

  return base;
}

/** Safety timeout when a platform does not emit a reliable “ended” event. */
export function getMediaPortraitFallbackMs(
  provider: PromotionVideoProvider
): number {
  switch (provider) {
    case "youtube":
      return 90_000;
    case "tiktok":
      return 75_000;
    case "facebook":
    case "instagram":
      return 60_000;
    default:
      return 60_000;
  }
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
