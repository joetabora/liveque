"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadYouTubeIframeAPI,
  YT_CUED,
  YT_ENDED,
  YT_PAUSED,
  type YouTubePlayer,
} from "@/lib/youtube-iframe-api";
import {
  buildPromotionEmbedSrc,
  getMediaPortraitFallbackMs,
  parsePromotionVideoUrl,
  type PromotionVideoEmbed,
} from "@/lib/promotion-video";

interface MediaPortraitPlayerProps {
  title: string;
  videoUrl: string;
  playbackKey: string | number;
  onEnded: () => void;
}

/** Stable YouTube player — swaps clips with loadVideoById (no iframe remount). */
function YouTubeEngine({
  videoId,
  onEnded,
}: {
  videoId: string;
  onEnded: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const readyRef = useRef(false);
  const endedGateRef = useRef(false);
  const videoIdRef = useRef(videoId);
  const onEndedRef = useRef(onEnded);
  const [blocked, setBlocked] = useState(false);

  videoIdRef.current = videoId;
  onEndedRef.current = onEnded;

  useEffect(() => {
    let cancelled = false;
    const mount = mountRef.current;
    if (!mount) return;

    const target = document.createElement("div");
    target.style.width = "100%";
    target.style.height = "100%";
    mount.appendChild(target);

    loadYouTubeIframeAPI()
      .then((YT) => {
        if (cancelled) return;

        playerRef.current = new YT.Player(target, {
          width: "100%",
          height: "100%",
          videoId: videoIdRef.current,
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            fs: 0,
            disablekb: 1,
            iv_load_policy: 3,
            origin: window.location.origin,
          },
          events: {
            onReady: (e) => {
              readyRef.current = true;
              endedGateRef.current = false;
              e.target.mute();
              e.target.playVideo();
              setBlocked(false);
            },
            onStateChange: (e) => {
              if (e.data === YT_ENDED) {
                if (endedGateRef.current) return;
                endedGateRef.current = true;
                onEndedRef.current();
                return;
              }
              if (e.data === YT_CUED || e.data === YT_PAUSED) {
                e.target.mute();
                e.target.playVideo();
              }
              if (e.data === 1) {
                // PLAYING
                setBlocked(false);
                endedGateRef.current = false;
              }
            },
            onError: () => {
              onEndedRef.current();
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) setBlocked(true);
      });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore
      }
      playerRef.current = null;
      readyRef.current = false;
      mount.innerHTML = "";
    };
  }, []);

  // Advance within the same player instance
  useEffect(() => {
    endedGateRef.current = false;
    const player = playerRef.current;
    if (!readyRef.current || !player) return;

    try {
      player.mute();
      player.loadVideoById({ videoId, startSeconds: 0 });
      const kick = window.setInterval(() => {
        try {
          player.mute();
          player.playVideo();
        } catch {
          // ignore
        }
      }, 400);
      const stop = window.setTimeout(() => {
        window.clearInterval(kick);
        try {
          if (player.getPlayerState() !== 1) setBlocked(true);
        } catch {
          setBlocked(true);
        }
      }, 5000);

      return () => {
        window.clearInterval(kick);
        window.clearTimeout(stop);
      };
    } catch {
      setBlocked(true);
    }
  }, [videoId]);

  // Fallback duration advance if ended event never fires
  useEffect(() => {
    endedGateRef.current = false;
    const timer = window.setTimeout(() => {
      if (endedGateRef.current) return;
      endedGateRef.current = true;
      onEndedRef.current();
    }, getMediaPortraitFallbackMs("youtube"));
    return () => window.clearTimeout(timer);
  }, [videoId]);

  const resume = () => {
    const player = playerRef.current;
    if (!player) return;
    try {
      player.mute();
      player.playVideo();
      setBlocked(false);
    } catch {
      // ignore
    }
  };

  return (
    <div className="absolute inset-0 bg-black">
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
      {blocked && (
        <button
          type="button"
          onClick={resume}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 text-white text-2xl font-bold"
        >
          Tap to play
        </button>
      )}
    </div>
  );
}

function parseMessageData(data: unknown): unknown {
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

function isTikTokEndedPayload(data: unknown): boolean {
  const parsed = parseMessageData(data);
  if (typeof parsed === "string") {
    const lower = parsed.toLowerCase();
    return lower.includes("ended") || lower.includes("onplayerended");
  }
  if (!parsed || typeof parsed !== "object") return false;
  const payload = parsed as Record<string, unknown>;
  const type = String(payload.type ?? payload.event ?? "").toLowerCase();
  return type.includes("ended") || type === "onplayerended";
}

function kickIframe(win: Window, embed: PromotionVideoEmbed) {
  if (embed.provider === "tiktok") {
    win.postMessage(
      JSON.stringify({ type: "play", "x-tiktok-player": true }),
      "*"
    );
  }
}

/** Non-YouTube embeds — remount with about:blank + tap-to-resume fallback. */
function IframeEngine({
  title,
  embed,
  playbackKey,
  onEnded,
}: {
  title: string;
  embed: PromotionVideoEmbed;
  playbackKey: string | number;
  onEnded: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const endedRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  const [src, setSrc] = useState<string>("about:blank");
  const [blocked, setBlocked] = useState(false);
  onEndedRef.current = onEnded;

  const embedSrc = (() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : undefined;
    const base = buildPromotionEmbedSrc(embed, { loop: false, origin });
    const url = new URL(base);
    url.searchParams.set("_lq", String(playbackKey));
    return url.toString();
  })();

  useEffect(() => {
    endedRef.current = false;
    setBlocked(false);
    setSrc("about:blank");
    const t = window.setTimeout(() => setSrc(embedSrc), 50);
    return () => window.clearTimeout(t);
  }, [embedSrc]);

  useEffect(() => {
    if (src === "about:blank") return;

    const finish = () => {
      if (endedRef.current) return;
      endedRef.current = true;
      onEndedRef.current();
    };

    const fallbackTimer = window.setTimeout(
      finish,
      getMediaPortraitFallbackMs(embed.provider)
    );

    const onMessage = (event: MessageEvent) => {
      if (
        embed.provider === "tiktok" &&
        event.origin.toLowerCase().includes("tiktok.com") &&
        isTikTokEndedPayload(event.data)
      ) {
        finish();
      }
    };
    window.addEventListener("message", onMessage);

    const kickTimer = window.setInterval(() => {
      const win = iframeRef.current?.contentWindow;
      if (win) kickIframe(win, embed);
    }, 600);

    const blockedTimer = window.setTimeout(() => setBlocked(true), 4000);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.clearTimeout(blockedTimer);
      window.clearInterval(kickTimer);
      window.removeEventListener("message", onMessage);
    };
  }, [src, embed, playbackKey]);

  const resume = () => {
    setBlocked(false);
    setSrc("about:blank");
    window.setTimeout(() => setSrc(embedSrc), 50);
  };

  return (
    <div className="absolute inset-0 bg-black">
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className="h-full w-full border-0 bg-black"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture; accelerometer; gyroscope"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
      {blocked && (
        <button
          type="button"
          onClick={resume}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 text-white text-2xl font-bold"
        >
          Tap to play
        </button>
      )}
    </div>
  );
}

/**
 * All-YouTube playlist: let YouTube auto-advance natively (most reliable).
 */
export function YouTubeNativePlaylist({
  videoIds,
  title,
}: {
  videoIds: string[];
  title: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (videoIds.length === 0) {
      setSrc(null);
      return;
    }
    const first = videoIds[0];
    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      controls: "0",
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
      fs: "0",
      disablekb: "1",
      iv_load_policy: "3",
      loop: "1",
      // Include all IDs so loop restarts the full playlist
      playlist: videoIds.join(","),
      enablejsapi: "1",
      origin: window.location.origin,
    });
    setSrc(`https://www.youtube.com/embed/${first}?${params.toString()}`);
  }, [videoIds]);

  if (!src) {
    return <div className="absolute inset-0 bg-black" />;
  }

  return (
    <div className="absolute inset-0 bg-black">
      <iframe
        src={src}
        title={title}
        className="h-full w-full border-0 bg-black"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}

export function MediaPortraitPlayer({
  title,
  videoUrl,
  playbackKey,
  onEnded,
}: MediaPortraitPlayerProps) {
  const embed = parsePromotionVideoUrl(videoUrl, { loop: false });

  if (!embed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black text-gray-500">
        Unsupported video link
      </div>
    );
  }

  if (embed.provider === "youtube") {
    return <YouTubeEngine videoId={embed.videoId} onEnded={onEnded} />;
  }

  return (
    <IframeEngine
      title={title}
      embed={embed}
      playbackKey={playbackKey}
      onEnded={onEnded}
    />
  );
}
