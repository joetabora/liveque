"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
} from "@/lib/promotion-video";

interface MediaPortraitPlayerProps {
  title: string;
  videoUrl: string;
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

function isTikTokPlayerMessage(
  data: unknown
): data is { type: string; value?: unknown; "x-tiktok-player": true } {
  const parsed = parseMessageData(data);
  if (!parsed || typeof parsed !== "object") return false;
  const payload = parsed as Record<string, unknown>;
  return payload["x-tiktok-player"] === true && typeof payload.type === "string";
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
        // Fall through — duration fallback will advance
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
      const stop = window.setTimeout(() => window.clearInterval(kick), 4000);
      return () => {
        window.clearInterval(kick);
        window.clearTimeout(stop);
      };
    } catch {
      // ignore
    }
  }, [videoId]);

  useEffect(() => {
    endedGateRef.current = false;
    const timer = window.setTimeout(() => {
      if (endedGateRef.current) return;
      endedGateRef.current = true;
      onEndedRef.current();
    }, getMediaPortraitFallbackMs("youtube"));
    return () => window.clearTimeout(timer);
  }, [videoId]);

  return (
    <div className="absolute inset-0 bg-black">
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

/**
 * TikTok player/v1 — listen for onStateChange=0 (ended) and force mute+play
 * on each clip. See https://developers.tiktok.com/doc/embed-player
 */
function TikTokEngine({
  videoId,
  onEnded,
}: {
  videoId: string;
  onEnded: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const endedRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  const durationRef = useRef(0);
  const fallbackTimerRef = useRef<number | null>(null);
  onEndedRef.current = onEnded;

  const src = useMemo(() => {
    const params = new URLSearchParams({
      autoplay: "1",
      muted: "1",
      loop: "0",
      controls: "0",
      progress_bar: "0",
      play_button: "0",
      volume_control: "0",
      fullscreen_button: "0",
      timestamp: "0",
      description: "0",
      music_info: "0",
      rel: "0",
    });
    return `https://www.tiktok.com/player/v1/${videoId}?${params.toString()}`;
  }, [videoId]);

  useEffect(() => {
    endedRef.current = false;
    durationRef.current = 0;
    const hasPlayedRef = { current: false };
    const readyAt = Date.now();
    const MIN_PLAY_MS = 2500;

    const finish = () => {
      if (endedRef.current) return;
      // Ignore false "ended" events before the clip has actually played.
      if (!hasPlayedRef.current) return;
      if (Date.now() - readyAt < MIN_PLAY_MS) return;
      endedRef.current = true;
      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      onEndedRef.current();
    };

    const post = (type: string, value?: unknown) => {
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      win.postMessage(
        JSON.stringify({
          type,
          value,
          "x-tiktok-player": true,
        }),
        "*"
      );
    };

    const kickPlay = () => {
      post("mute");
      post("play");
    };

    const scheduleFallback = (ms: number) => {
      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current);
      }
      fallbackTimerRef.current = window.setTimeout(finish, Math.max(ms, MIN_PLAY_MS));
    };

    // Default short-form fallback; refined once we know duration
    scheduleFallback(getMediaPortraitFallbackMs("tiktok"));

    const onMessage = (event: MessageEvent) => {
      if (!event.origin.toLowerCase().includes("tiktok.com")) return;
      if (!isTikTokPlayerMessage(event.data)) return;

      const { type, value } = event.data;

      if (type === "onPlayerReady") {
        kickPlay();
        return;
      }

      if (type === "onStateChange") {
        const state = Number(value);
        // -1 init, 0 ended, 1 playing, 2 paused, 3 buffering
        if (state === 1) {
          hasPlayedRef.current = true;
          return;
        }
        if (state === 0) {
          finish();
          return;
        }
        if (state === 2 && hasPlayedRef.current) {
          // Keep kiosk playback going if TikTok pauses itself mid-clip
          kickPlay();
        }
        return;
      }

      if (type === "onCurrentTime") {
        let currentTime = 0;
        let duration = durationRef.current;

        if (value && typeof value === "object") {
          const v = value as { currentTime?: unknown; duration?: unknown };
          currentTime = Number(v.currentTime) || 0;
          if (currentTime > 0.5) hasPlayedRef.current = true;
          if (Number(v.duration) > 0) {
            duration = Number(v.duration);
            durationRef.current = duration;
            const remainingMs = Math.max(
              MIN_PLAY_MS,
              (duration - currentTime + 0.5) * 1000
            );
            scheduleFallback(remainingMs);
          }
        }

        if (
          hasPlayedRef.current &&
          duration > 1 &&
          currentTime >= duration - 0.35
        ) {
          finish();
        }
      }

      // Don't auto-skip on embed errors — often fire during load on kiosk browsers
    };

    window.addEventListener("message", onMessage);

    const kickTimer = window.setInterval(kickPlay, 500);
    const stopKicks = window.setTimeout(() => window.clearInterval(kickTimer), 8000);
    const earlyKick = window.setTimeout(kickPlay, 300);

    return () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(kickTimer);
      window.clearTimeout(stopKicks);
      window.clearTimeout(earlyKick);
      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [videoId, src]);

  return (
    <div className="absolute inset-0 bg-black">
      <iframe
        ref={iframeRef}
        key={src}
        src={src}
        title={`TikTok ${videoId}`}
        className="h-full w-full border-0 bg-black"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture; accelerometer; gyroscope"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}

/** Facebook / Instagram and other iframe embeds. */
function IframeEngine({
  title,
  videoUrl,
  playbackKey,
  onEnded,
}: {
  title: string;
  videoUrl: string;
  playbackKey: string | number;
  onEnded: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const endedRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  const [src, setSrc] = useState<string>("about:blank");
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
    const url = new URL(base);
    url.searchParams.set("_lq", String(playbackKey));
    return url.toString();
  }, [embed, playbackKey]);

  useEffect(() => {
    endedRef.current = false;
    setSrc("about:blank");
    if (!embedSrc) return;
    const t = window.setTimeout(() => setSrc(embedSrc), 50);
    return () => window.clearTimeout(t);
  }, [embedSrc]);

  useEffect(() => {
    if (!embed || src === "about:blank") return;

    const finish = () => {
      if (endedRef.current) return;
      endedRef.current = true;
      onEndedRef.current();
    };

    const fallbackTimer = window.setTimeout(
      finish,
      getMediaPortraitFallbackMs(embed.provider)
    );

    return () => window.clearTimeout(fallbackTimer);
  }, [src, embed, playbackKey]);

  if (!embed || !embedSrc) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black text-gray-500">
        Unsupported video link
      </div>
    );
  }

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

  if (embed.provider === "tiktok") {
    return <TikTokEngine videoId={embed.videoId} onEnded={onEnded} />;
  }

  return (
    <IframeEngine
      title={title}
      videoUrl={videoUrl}
      playbackKey={playbackKey}
      onEnded={onEnded}
    />
  );
}
