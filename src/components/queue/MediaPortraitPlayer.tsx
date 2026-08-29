"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  buildPromotionEmbedSrc,
  getMediaPortraitFallbackMs,
  parsePromotionVideoUrl,
  type PromotionVideoEmbed,
  type PromotionVideoProvider,
} from "@/lib/promotion-video";

interface MediaPortraitPlayerProps {
  title: string;
  videoUrl: string;
  /** Bump when advancing so each clip gets a fresh embed + play kick. */
  playbackKey: string | number;
  onEnded: () => void;
}

function parseMessageData(data: unknown): unknown {
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

function isYouTubeEndedPayload(data: unknown): boolean {
  const parsed = parseMessageData(data);
  if (typeof parsed === "string") {
    return parsed.includes('"info":0') || parsed.includes('"info": 0');
  }
  if (!parsed || typeof parsed !== "object") return false;
  const payload = parsed as { event?: string; info?: number | string };
  return (
    payload.event === "onStateChange" &&
    (payload.info === 0 || payload.info === "0")
  );
}

function isYouTubeReadyPayload(data: unknown): boolean {
  const parsed = parseMessageData(data);
  if (typeof parsed === "string") return parsed.includes("onReady");
  if (!parsed || typeof parsed !== "object") return false;
  return (parsed as { event?: string }).event === "onReady";
}

function isTikTokEndedPayload(data: unknown): boolean {
  const parsed = parseMessageData(data);
  if (typeof parsed === "string") {
    const lower = parsed.toLowerCase();
    return (
      lower.includes("ended") ||
      lower.includes("onplayerended") ||
      lower.includes('"type":"end"')
    );
  }
  if (!parsed || typeof parsed !== "object") return false;
  const payload = parsed as Record<string, unknown>;
  const type = String(
    payload.type ?? payload.event ?? payload.name ?? ""
  ).toLowerCase();
  if (type.includes("ended") || type === "onplayerended") return true;
  if (payload["x-tiktok-player"] === true && type.includes("end")) return true;
  return false;
}

function postYouTubeCommand(
  win: Window,
  func: string,
  args: unknown[] = []
) {
  win.postMessage(
    JSON.stringify({ event: "command", func, args }),
    "*"
  );
}

function kickPlayback(win: Window, embed: PromotionVideoEmbed) {
  if (embed.provider === "youtube") {
    postYouTubeCommand(win, "mute");
    postYouTubeCommand(win, "playVideo");
    return;
  }

  if (embed.provider === "tiktok") {
    // TikTok player/v1 — best-effort play signals
    win.postMessage(
      JSON.stringify({ type: "play", "x-tiktok-player": true }),
      "*"
    );
    win.postMessage(
      JSON.stringify({ event: "play", "x-tiktok-player": true }),
      "*"
    );
  }
}

export function MediaPortraitPlayer({
  title,
  videoUrl,
  playbackKey,
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
    const base = buildPromotionEmbedSrc(embed, { loop: false, origin });
    // Cache-bust so the browser does not reuse a paused player instance.
    const url = new URL(base);
    url.searchParams.set("_lq", String(playbackKey));
    return url.toString();
  }, [embed, playbackKey]);

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
      const win = iframeRef.current?.contentWindow;

      if (provider === "youtube" && origin.includes("youtube.com")) {
        if (isYouTubeReadyPayload(event.data) && win) {
          kickPlayback(win, embed);
        }
        if (isYouTubeEndedPayload(event.data)) finish();
        return;
      }

      if (provider === "tiktok" && origin.includes("tiktok.com")) {
        if (isTikTokEndedPayload(event.data)) finish();
      }
    };

    window.addEventListener("message", onMessage);

    // Handshake + repeated play kicks — needed when the next iframe mounts
    // without a fresh user gesture (first clip often works, later ones stall).
    const kickTimer = window.setInterval(() => {
      const win = iframeRef.current?.contentWindow;
      if (!win) return;

      if (embed.provider === "youtube") {
        win.postMessage(
          JSON.stringify({ event: "listening", id: embed.videoId }),
          "*"
        );
      }

      kickPlayback(win, embed);
    }, 500);

    const stopKicks = window.setTimeout(() => {
      window.clearInterval(kickTimer);
    }, 8000);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.clearTimeout(stopKicks);
      window.clearInterval(kickTimer);
      window.removeEventListener("message", onMessage);
    };
  }, [embed, videoUrl, playbackKey]);

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
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture; accelerometer; gyroscope"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
      <ProviderHint provider={embed.provider} />
    </div>
  );
}

function ProviderHint({ provider }: { provider: PromotionVideoProvider }) {
  return <span className="sr-only">Playing {provider} video</span>;
}
