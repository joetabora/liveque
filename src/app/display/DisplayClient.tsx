"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueue } from "@/hooks/useQueue";
import { Clock } from "@/components/ui/Clock";

export default function DisplayClient() {
  const { waiting, serving, loading, servingChanged, playNotification } =
    useQueue();
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
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-harley-orange border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 uppercase tracking-widest text-sm">
            Loading
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen bg-iron-black flex flex-col relative overflow-hidden"
    >
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-harley-orange/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[300px] bg-harley-orange/3 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-iron-border/50 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black tracking-tight text-white">
            Welcome <span className="text-harley-orange">To</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <Clock className="text-2xl text-gray-400" />
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </header>

      {/* Split Layout */}
      <main className="relative z-10 flex-1 flex min-h-0">
        {/* Left Side — Logo + Title */}
        <div className="w-1/2 flex flex-col items-center justify-center px-8 border-r border-iron-border/30">
          <img
            src="/mkehd2.png"
            alt="Milwaukee Harley-Davidson"
            className="w-full max-w-2xl h-auto mb-8 object-contain"
          />
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white text-center leading-tight">
            Today&apos;s
            <br />
            <span className="text-harley-orange">Appointments</span>
          </h2>
          <div className="mt-6 h-1 w-24 bg-harley-orange/40 rounded-full" />
          <p className="mt-4 text-lg text-gray-500 font-semibold tabular-nums">
            {waiting.length} {waiting.length === 1 ? "guest" : "guests"} today
          </p>
        </div>

        {/* Right Side — Names List */}
        <div className="w-1/2 flex flex-col min-h-0 px-6 py-6">
          {/* Now Serving Banner */}
          <AnimatePresence mode="wait">
            {serving && (
              <motion.div
                key={serving.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="glow-orange-strong rounded-2xl bg-iron-panel/80 border border-harley-orange/30 px-8 py-5 mb-6 flex items-center justify-between flex-shrink-0"
              >
                <div className="flex items-center gap-4">
                  <span className="relative flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-harley-orange opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-harley-orange" />
                  </span>
                  <span className="text-base font-bold uppercase tracking-widest text-harley-orange">
                    Now Serving
                  </span>
                </div>
                <h3 className="text-4xl md:text-5xl font-black text-white text-glow-orange">
                  {serving.name}
                </h3>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scrollable Appointment List */}
          <div
            ref={scrollContainerRef}
            className="flex-1 min-h-0 overflow-hidden relative"
          >
            {needsScroll && (
              <>
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-iron-black to-transparent z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-iron-black to-transparent z-10 pointer-events-none" />
              </>
            )}

            <div ref={listRef}>
              {waiting.length === 0 && !serving ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                  <h3 className="text-3xl font-bold tracking-tight">No Appointments</h3>
                  <p className="mt-3 text-lg">The queue is currently empty</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  <AnimatePresence>
                    {waiting.map((item, index) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center px-8 py-5 rounded-2xl bg-gradient-to-r from-iron-panel/90 via-iron-panel/70 to-iron-panel/90 border border-iron-border/30 shadow-lg"
                      >
                        <div className="flex items-center gap-4 w-full">
                          <span className="text-harley-orange text-xl">★</span>
                          <h3 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white">
                            {item.name}
                          </h3>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-3 border-t border-iron-border/30 flex items-center justify-between flex-shrink-0">
        <span className="text-xs text-gray-600 uppercase tracking-widest">
          {waiting.length} in queue
        </span>
        <span className="text-xs text-gray-600 uppercase tracking-widest">
          IronQueue Display System
        </span>
      </footer>

      {/* Serving changed flash overlay */}
      <AnimatePresence>
        {servingChanged && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none border-4 border-harley-orange/50 rounded-none z-50"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
