"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

function isFullscreenActive() {
  return !!(
    document.fullscreenElement ??
    (document as Document & { webkitFullscreenElement?: Element })
      .webkitFullscreenElement
  );
}

async function requestElementFullscreen(element: HTMLElement) {
  if (isFullscreenActive()) return true;

  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if (
      "webkitRequestFullscreen" in element &&
      typeof element.webkitRequestFullscreen === "function"
    ) {
      await element.webkitRequestFullscreen();
    } else {
      return false;
    }
    return isFullscreenActive();
  } catch {
    return false;
  }
}

export function useDisplayFullscreen(
  containerRef: RefObject<HTMLElement | null>,
  { kiosk = false }: { kiosk?: boolean } = {}
) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const sync = () => setIsFullscreen(isFullscreenActive());

    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);

    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  useEffect(() => {
    if (!kiosk || isFullscreen) {
      setShowPrompt(false);
      return;
    }

    const el = containerRef.current;
    if (!el) {
      setShowPrompt(true);
      return;
    }

    let cancelled = false;
    requestElementFullscreen(el).then((entered) => {
      if (!cancelled && !entered) setShowPrompt(true);
    });

    return () => {
      cancelled = true;
    };
  }, [kiosk, isFullscreen, containerRef]);

  const enterFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return false;
    const entered = await requestElementFullscreen(el);
    if (entered) setShowPrompt(false);
    return entered;
  }, [containerRef]);

  const exitFullscreen = useCallback(() => {
    if (!isFullscreenActive()) return;

    if (document.exitFullscreen) {
      void document.exitFullscreen();
    } else if (
      "webkitExitFullscreen" in document &&
      typeof document.webkitExitFullscreen === "function"
    ) {
      document.webkitExitFullscreen();
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreenActive()) {
      exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreen]);

  const dismissPrompt = useCallback(async () => {
    await enterFullscreen();
  }, [enterFullscreen]);

  return {
    isFullscreen,
    showPrompt: kiosk && showPrompt && !isFullscreen,
    toggleFullscreen,
    dismissPrompt,
  };
}
