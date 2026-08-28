"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueue } from "@/hooks/useQueue";
import { useTenant } from "@/contexts/TenantContext";
import { useDisplayFullscreen } from "@/hooks/useDisplayFullscreen";
import { Clock } from "@/components/ui/Clock";
import { DisplayFullscreenPrompt } from "@/components/queue/DisplayFullscreenPrompt";
import { PromotionCarouselMedia } from "@/components/queue/PromotionCarouselMedia";

interface Promotion {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
}

interface PortraitDisplayBoardProps {
  tenantId: string | null;
  slug: string;
  useLegacy?: boolean;
  kiosk?: boolean;
}

const CAROUSEL_INTERVAL_MS = 8000;
const VIDEO_CAROUSEL_INTERVAL_MS = 30000;
const PROMO_REFETCH_MS = 30000;

export default function PortraitDisplayBoard({
  tenantId,
  slug,
  useLegacy = false,
  kiosk = false,
}: PortraitDisplayBoardProps) {
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
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);

  const fetchPromotions = useCallback(async () => {
    try {
      const res = await fetch(`/api/tenants/${slug}/promotions`);
      if (!res.ok) return;
      const data: Promotion[] = await res.json();
      setPromotions(data);
      setCarouselIndex((prev) =>
        data.length === 0 ? 0 : Math.min(prev, data.length - 1)
      );
    } catch {
      // Display boards should keep working if promos fail to load
    }
  }, [slug]);

  useEffect(() => {
    fetchPromotions();
    const interval = setInterval(fetchPromotions, PROMO_REFETCH_MS);
    return () => clearInterval(interval);
  }, [fetchPromotions]);

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
  }, [waiting, promotions.length]);

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

  useEffect(() => {
    if (promotions.length <= 1 || carouselPaused) return;

    const current = promotions[carouselIndex];
    const intervalMs = current?.videoUrl
      ? VIDEO_CAROUSEL_INTERVAL_MS
      : CAROUSEL_INTERVAL_MS;

    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % promotions.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [promotions, carouselIndex, carouselPaused]);

  const { toggleFullscreen, showPrompt, dismissPrompt } = useDisplayFullscreen(
    containerRef,
    { kiosk }
  );

  const headlineParts = displayHeadline.split(" ");
  const headlineFirst = headlineParts.slice(0, -1).join(" ") || displayHeadline;
  const headlineAccent =
    headlineParts.length > 1 ? headlineParts[headlineParts.length - 1] : "";

  const hasPromotions = promotions.length > 0;
  const currentPromo = hasPromotions ? promotions[carouselIndex] : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-iron-black">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen bg-iron-black flex flex-col relative overflow-hidden"
      style={
        {
          "--brand-primary": brandColor,
          "--brand-accent": accentColor,
        } as React.CSSProperties
      }
    >
      <DisplayFullscreenPrompt
        show={showPrompt}
        onActivate={dismissPrompt}
        brandColor={brandColor}
      />

      {!connected && error && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-amber-900/90 text-amber-100 text-center py-2 text-sm">
          {error}
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full blur-[120px]"
          style={{ backgroundColor: `${brandColor}0d` }}
        />
      </div>

      {/* Queue section — top ~55% when promos exist */}
      <div
        className={`relative z-10 flex flex-col min-h-0 ${
          hasPromotions ? "flex-[55]" : "flex-1"
        }`}
      >
        <header className="flex items-center justify-between px-8 py-4 border-b border-iron-border/50 flex-shrink-0">
          <div className="flex items-center gap-6 min-w-0">
            {logoUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoUrl}
                alt={tenant?.name ?? "Business logo"}
                className="h-14 w-auto object-contain flex-shrink-0"
              />
            )}
            <h1 className="text-xl font-black tracking-tight text-white truncate">
              {welcomeMessage.split(" ").slice(0, -1).join(" ")}{" "}
              <span style={{ color: brandColor }}>
                {welcomeMessage.split(" ").slice(-1)[0]}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <Clock className="text-xl text-gray-400" />
            {!kiosk && (
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors cursor-pointer"
                title="Toggle Fullscreen"
              >
                ⛶
              </button>
            )}
          </div>
        </header>

        <div className="px-8 py-4 flex-shrink-0">
          <h2 className="text-3xl font-black tracking-tight text-white text-center leading-tight">
            {headlineFirst}
            {headlineAccent && (
              <>
                {" "}
                <span style={{ color: brandColor }}>{headlineAccent}</span>
              </>
            )}
          </h2>
          <p className="mt-2 text-center text-base text-gray-500 font-semibold tabular-nums">
            {waiting.length}{" "}
            {waiting.length === 1
              ? guestLabel.replace(/s$/, "")
              : guestLabel}{" "}
            today
          </p>
        </div>

        <div className="flex-1 flex flex-col min-h-0 px-6 pb-4">
          <AnimatePresence mode="wait">
            {serving && (
              <motion.div
                key={serving.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-2xl bg-iron-panel/80 border px-6 py-4 mb-4 flex flex-col items-center text-center flex-shrink-0"
                style={{ borderColor: `${brandColor}4d` }}
              >
                <span
                  className="text-sm font-bold uppercase tracking-widest"
                  style={{ color: brandColor }}
                >
                  Now Serving
                </span>
                <h3 className="text-4xl font-black text-white mt-1">{serving.name}</h3>
                {serving.hereToSee && (
                  <p className="mt-1 text-lg text-gray-400">
                    Here to see{" "}
                    <span className="text-white font-semibold">{serving.hereToSee}</span>
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div
            ref={scrollContainerRef}
            className="flex-1 min-h-0 overflow-hidden relative"
          >
            <div ref={listRef}>
              {waiting.length === 0 && !serving ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                  <h3 className="text-2xl font-bold">No Appointments</h3>
                  <p className="mt-2 text-base">The queue is currently empty</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {waiting.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center px-6 py-4 rounded-2xl bg-iron-panel/80 border border-iron-border/30"
                    >
                      <span
                        className="text-lg flex-shrink-0 mr-3"
                        style={{ color: brandColor }}
                      >
                        ★
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-2xl font-black text-white truncate">
                          {item.name}
                        </h3>
                        {item.hereToSee && (
                          <p className="mt-0.5 text-base text-gray-400 truncate">
                            Here to see{" "}
                            <span className="text-gray-200 font-semibold">
                              {item.hereToSee}
                            </span>
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
      </div>

      {/* Promo carousel — bottom ~45% */}
      {hasPromotions && currentPromo && (
        <div
          className="relative z-10 flex-[45] min-h-0 border-t border-iron-border/50 flex flex-col bg-black"
          onPointerDown={() => setCarouselPaused(true)}
          onPointerUp={() => setCarouselPaused(false)}
          onPointerLeave={() => setCarouselPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPromo.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 min-h-0 flex flex-col"
            >
              <PromotionCarouselMedia
                title={currentPromo.title}
                subtitle={currentPromo.subtitle}
                imageUrl={currentPromo.imageUrl}
                videoUrl={currentPromo.videoUrl}
              />
            </motion.div>
          </AnimatePresence>

          {promotions.length > 1 && (
            <div className="flex justify-center gap-2 py-3 flex-shrink-0">
              {promotions.map((promo, index) => (
                <button
                  key={promo.id}
                  type="button"
                  aria-label={`Show promotion ${index + 1}`}
                  onClick={() => setCarouselIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    index === carouselIndex ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
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
