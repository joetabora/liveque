"use client";

/**
 * Loads the YouTube IFrame Player API once per page.
 * https://developers.google.com/youtube/iframe_api_reference
 */

export interface YouTubePlayer {
  mute: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  loadVideoById: (opts: { videoId: string; startSeconds?: number }) => void;
  destroy: () => void;
  getPlayerState: () => number;
}

export interface YouTubePlayerEvent {
  target: YouTubePlayer;
  data: number;
}

interface YouTubeNamespace {
  Player: new (
    element: HTMLElement | string,
    options: {
      width?: string | number;
      height?: string | number;
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: YouTubePlayerEvent) => void;
        onStateChange?: (e: YouTubePlayerEvent) => void;
        onError?: (e: YouTubePlayerEvent) => void;
      };
    }
  ) => YouTubePlayer;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YouTubeNamespace> | null = null;

export function loadYouTubeIframeAPI(): Promise<YouTubeNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API requires a browser"));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      if (!window.YT?.Player) return;
      settled = true;
      resolve(window.YT);
    };

    const prior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      try {
        prior?.();
      } catch {
        // ignore
      }
      finish();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.onerror = () => {
        if (!settled) {
          settled = true;
          apiPromise = null;
          reject(new Error("Failed to load YouTube iframe_api script"));
        }
      };
      document.head.appendChild(tag);
    }

    const poll = window.setInterval(() => {
      finish();
      if (settled) window.clearInterval(poll);
    }, 50);

    window.setTimeout(() => {
      window.clearInterval(poll);
      if (!settled) {
        settled = true;
        apiPromise = null;
        reject(new Error("Timed out loading YouTube IFrame API"));
      }
    }, 15000);
  });

  return apiPromise;
}

export const YT_ENDED = 0;
export const YT_PLAYING = 1;
export const YT_PAUSED = 2;
export const YT_CUED = 5;
