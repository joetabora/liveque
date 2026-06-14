"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueue } from "@/hooks/useQueue";
import { useTenant } from "@/contexts/TenantContext";
import { Clock } from "@/components/ui/Clock";

interface DisplayBoardProps {
  tenantId: string | null;
  useLegacy?: boolean;
  kiosk?: boolean;
}

export default function DisplayBoard({
  tenantId,
  useLegacy = false,
  kiosk = false,
}: DisplayBoardProps) {
  const { tenant } = useTenant();
  const { waiting, serving, loading, servingChanged, playNotification, connected, error } =
    useQueue({ tenantId, useLegacy });

  const brandColor = tenant?.brandColor ?? "#0065a6";
  const accentColor = tenant?.accentColor ?? "#004f85";
  const logoUrl = tenant?.logoUrl ?? "/mkehd2.png";
  const welcomeMessage = tenant?.welcomeMessage ?? "Welcome To";
  const displayHeadline = tenant?.displayHeadline ?? "Today's Appointments";
  const guestLabel = tenant?.settings?.terminology?.guestLabel ?? "guests";

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevServingRef = useRef<string | null>(null);
  const animationRef = useRef<number | null>(null);
  const [needsScroll, setNeedsScroll] = useState(false);

  useEffect(() => {
    if (serving && prevServingRef.current !== serving.id) {
      playNotification();
      prevServingRef.current = serving.id;
    }
  }, [serving, playNotification]);

  useEffect(() => {
    const scrollEl = scrollContainerRef.current;
    const listEl = listRef.current;
    if (!scrollEl || !listEl) return;

    const checkOverflow = () => {
      setNeedsScroll(listEl.scrollHeight > scrollEl.clientHeight);
    };

    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(scrollEl);
    observer.observe(listEl);
    return () => observer.disconnect();
  }, [waiting]);

  useEffect(() => {
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl || !needsScroll) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    let scrollPos = 0;
    let direction = 1;
    let pauseUntil = 0;
    const SPEED = 0.5;
    const PAUSE_MS = 3000;

    const step = () => {
      const now = Date.now();
      if (now < pauseUntil) {
        animationRef.current = requestAnimationFrame(step);
        return;
      }

      const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
      scrollPos += SPEED * direction;

      if (scrollPos >= maxScroll) {
        scrollPos = maxScroll;
        direction = -1;
        pauseUntil = now + PAUSE_MS;
      } else if (scrollPos <= 0) {
        scrollPos = 0;
        direction = 1;
        pauseUntil = now + PAUSE_MS;
      }

      scrollEl.scrollTop = scrollPos;
      animationRef.current = requestAnimationFrame(step);
    };

    pauseUntil = Date.now() + PAUSE_MS;
    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [needsScroll, waiting]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-iron-black">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const headlineParts = displayHeadline.split(" ");
  const headlineFirst = headlineParts.slice(0, -1).join(" ") || displayHeadline;
  const headlineAccent = headlineParts.length > 1 ? headlineParts[headlineParts.length - 1] : "";

  return (
    <div
      ref={containerRef}
      className="h-screen bg-iron-black flex flex-col relative overflow-hidden"
      style={{ "--brand-primary": brandColor, "--brand-accent": accentColor } as React.CSSProperties}
    >
      {!connected && error && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-amber-900/90 text-amber-100 text-center py-2 text-sm">
          {error}
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full blur-[120px]" style={{ backgroundColor: `${brandColor}0d` }} />
      </div>

      {!kiosk && (
        <header className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-iron-border/50 flex-shrink-0">
          <h1 className="text-2xl font-black tracking-tight text-white">
            {welcomeMessage.split(" ").slice(0, -1).join(" ")}{" "}
            <span style={{ color: brandColor }}>
              {welcomeMessage.split(" ").slice(-1)[0]}
            </span>
          </h1>
          <div className="flex items-center gap-6">
            <Clock className="text-2xl text-gray-400" />
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors cursor-pointer"
              title="Toggle Fullscreen"
            >
              ⛶
            </button>
          </div>
        </header>
      )}

      <main className="relative z-10 flex-1 flex min-h-0">
        <div className="w-1/2 flex flex-col items-center justify-center px-8 border-r border-iron-border/30">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={tenant?.name ?? "Business logo"}
              className="w-full max-w-2xl h-auto mb-8 object-contain"
            />
          )}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white text-center leading-tight">
            {headlineFirst}
            {headlineAccent && (
              <>
                <br />
                <span style={{ color: brandColor }}>{headlineAccent}</span>
              </>
            )}
          </h2>
          <div className="mt-6 h-1 w-24 rounded-full" style={{ backgroundColor: `${brandColor}66` }} />
          <p className="mt-4 text-lg text-gray-500 font-semibold tabular-nums">
            {waiting.length} {waiting.length === 1 ? guestLabel.replace(/s$/, "") : guestLabel} today
          </p>
        </div>

        <div className="w-1/2 flex flex-col min-h-0 px-6 py-6">
          <AnimatePresence mode="wait">
            {serving && (
              <motion.div
                key={serving.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-2xl bg-iron-panel/80 border px-8 py-5 mb-6 flex items-center justify-between flex-shrink-0"
                style={{ borderColor: `${brandColor}4d` }}
              >
                <span className="text-base font-bold uppercase tracking-widest" style={{ color: brandColor }}>
                  Now Serving
                </span>
                <div className="text-right">
                  <h3 className="text-4xl md:text-5xl font-black text-white">{serving.name}</h3>
                  {serving.hereToSee && (
                    <p className="mt-1 text-lg text-gray-400">
                      Here to see <span className="text-white font-semibold">{serving.hereToSee}</span>
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-hidden relative">
            <div ref={listRef}>
              {waiting.length === 0 && !serving ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                  <h3 className="text-3xl font-bold">No Appointments</h3>
                  <p className="mt-3 text-lg">The queue is currently empty</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {waiting.map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center px-8 py-5 rounded-2xl bg-iron-panel/80 border border-iron-border/30"
                    >
                      <span className="text-xl flex-shrink-0 mr-4" style={{ color: brandColor }}>★</span>
                      <div className="min-w-0">
                        <h3 className="text-3xl md:text-4xl font-black text-white truncate">{item.name}</h3>
                        {item.hereToSee && (
                          <p className="mt-1 text-lg text-gray-400 truncate">
                            Here to see <span className="text-gray-200 font-semibold">{item.hereToSee}</span>
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {!kiosk && (
        <footer className="relative z-10 px-8 py-3 border-t border-iron-border/30 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-gray-600 uppercase tracking-widest">{waiting.length} in queue</span>
          <span className="text-xs text-gray-600 uppercase tracking-widest">LiveQue Display</span>
        </footer>
      )}

      <AnimatePresence>
        {servingChanged && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none border-4 rounded-none z-50"
            style={{ borderColor: `${brandColor}80` }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
