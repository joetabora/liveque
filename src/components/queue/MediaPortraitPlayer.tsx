"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  buildPromotionEmbedSrc,
  getMediaPortraitFallbackMs,
  parsePromotionVideoUrl,
  type PromotionVideoProvider,
} from "@/lib/promotion-video";

interface MediaPortraitPlayerProps {
  title: string;
  videoUrl: string;
  onEnded: () => void;
}

function isYouTubeEndedPayload(data: unknown): boolean {
  if (typeof data === "string") {
    try {
      return isYouTubeEndedPayload(JSON.parse(data));
    } catch {
      return data.includes('"info":0') || data.includes('"info": 0');
    }
  }
  if (!data || typeof data !== "object") return false;
  const payload = data as { event?: string; info?: number | string };
  return (
    payload.event === "onStateChange" &&
    (payload.info === 0 || payload.info === "0")
  );
}

function isTikTokEndedPayload(data: unknown): boolean {
  if (typeof data === "string") {
    try {
      return isTikTokEndedPayload(JSON.parse(data));
    } catch {
      const lower = data.toLowerCase();
      return (
        lower.includes("ended") ||
        lower.includes("onplayerended") ||
        lower.includes('"type":"end"')
      );
    }
  }
  if (!data || typeof data !== "object") return false;
  const payload = data as Record<string, unknown>;
  const type = String(payload.type ?? payload.event ?? payload.name ?? "").toLowerCase();
  if (type.includes("ended") || type === "onplayerended") return true;
  if (payload["x-tiktok-player"] === true && type.includes("end")) return true;
  return false;
}

export function MediaPortraitPlayer({
  title,
  videoUrl,
  onEnded,
}: MediaPortraitPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const endedRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const embed = useMemo(
    () => parsePromotionVideoUrl(videoUrl, { loop: false }),
    [videoUrl]
  );

  const embedSrc = useMemo(() => {
    if (!embed) return null;
    const origin =
      typeof window !== "undefined" ? window.location.origin : undefined;
    return buildPromotionEmbedSrc(embed, { loop: false, origin });
  }, [embed]);

  useEffect(() => {
    endedRef.current = false;
    if (!embed) return;

    const finish = () => {
      if (endedRef.current) return;
      endedRef.current = true;
      onEndedRef.current();
    };

    const fallbackMs = getMediaPortraitFallbackMs(embed.provider);
    const fallbackTimer = window.setTimeout(finish, fallbackMs);

    const onMessage = (event: MessageEvent) => {
      const origin = event.origin.toLowerCase();
      const provider = embed.provider;

      if (provider === "youtube" && origin.includes("youtube.com")) {
        if (isYouTubeEndedPayload(event.data)) finish();
        return;
      }

      if (provider === "tiktok" && origin.includes("tiktok.com")) {
        if (isTikTokEndedPayload(event.data)) finish();
      }
    };

    window.addEventListener("message", onMessage);

    // YouTube JS API needs a listening handshake before state events fire.
    const handshake =
      embed.provider === "youtube"
        ? window.setInterval(() => {
            const win = iframeRef.current?.contentWindow;
            if (!win) return;
            win.postMessage(
              JSON.stringify({ event: "listening", id: embed.videoId }),
              "*"
            );
          }, 1000)
        : null;

    return () => {
      window.clearTimeout(fallbackTimer);
      if (handshake) window.clearInterval(handshake);
      window.removeEventListener("message", onMessage);
    };
  }, [embed, videoUrl]);

  if (!embed || !embedSrc) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black text-gray-500">
        Unsupported video link
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <iframe
        ref={iframeRef}
        key={embedSrc}
        src={embedSrc}
        title={title}
        className="h-full w-full border-0 bg-black"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
      <ProviderHint provider={embed.provider} />
    </div>
  );
}

function ProviderHint({ provider }: { provider: PromotionVideoProvider }) {
  // Invisible accessibility label only — keep the kiosk visually clean.
  return (
    <span className="sr-only">Playing {provider} video</span>
  );
}
