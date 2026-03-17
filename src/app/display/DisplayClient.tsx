"use client";

import { useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueue } from "@/hooks/useQueue";
import { Clock } from "@/components/ui/Clock";
import { Badge } from "@/components/ui/Badge";
import { ESTIMATED_WAIT_MINUTES } from "@/lib/constants";

export default function DisplayClient() {
  const { waiting, serving, loading, servingChanged, playNotification } =
    useQueue();
  const upNext = waiting.slice(0, 5);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevServingRef = useRef<string | null>(null);

  useEffect(() => {
    if (serving && prevServingRef.current !== serving.id) {
      playNotification();
      prevServingRef.current = serving.id;
    }
  }, [serving, playNotification]);

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
            Loading Queue
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-iron-black flex flex-col relative overflow-hidden"
    >
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-harley-orange/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[300px] bg-harley-orange/3 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-iron-border/50">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-black tracking-tight">
            <span className="text-white">IRON</span>
            <span className="text-harley-orange">QUEUE</span>
          </h1>
          <div className="h-8 w-px bg-iron-border" />
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
            Service Queue
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Clock className="text-2xl text-gray-400" />
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 py-12 gap-16">
        {/* NOW SERVING */}
        <section className="w-full max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <Badge variant="orange" pulse={!!serving}>
              Now Serving
            </Badge>
          </motion.div>

          <AnimatePresence mode="wait">
            {serving ? (
              <motion.div
                key={serving.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="glow-orange-strong rounded-3xl bg-iron-panel/80 border border-harley-orange/30 px-16 py-12"
              >
                <h2 className="text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-white text-glow-orange leading-none">
                  {serving.name}
                </h2>
                {serving.serviceType && (
                  <p className="mt-6 text-xl md:text-2xl text-harley-orange font-semibold uppercase tracking-widest">
                    {serving.serviceType}
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-3xl bg-iron-panel/40 border border-iron-border/50 px-16 py-12"
              >
                <h2 className="text-5xl md:text-6xl font-bold text-gray-600 tracking-tight">
                  Queue Empty
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  No one is currently being served
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* UP NEXT */}
        {upNext.length > 0 && (
          <section className="w-full max-w-4xl">
            <div className="text-center mb-8">
              <Badge variant="gray">Up Next</Badge>
            </div>
            <div className="grid gap-4">
              <AnimatePresence>
                {upNext.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      flex items-center justify-between px-8 py-5 rounded-2xl
                      border transition-all duration-300
                      ${
                        index === 0
                          ? "bg-iron-panel border-harley-orange/20 shadow-lg"
                          : "bg-iron-dark border-iron-border/50"
                      }
                    `}
                  >
                    <div className="flex items-center gap-6">
                      <span
                        className={`
                          text-2xl font-black w-10 text-center
                          ${index === 0 ? "text-harley-orange" : "text-gray-600"}
                        `}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <h3
                          className={`text-2xl md:text-3xl font-bold tracking-tight ${
                            index === 0 ? "text-white" : "text-gray-300"
                          }`}
                        >
                          {item.name}
                        </h3>
                        {item.serviceType && (
                          <p className="text-sm text-gray-500 uppercase tracking-wider mt-1">
                            {item.serviceType}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">
                        ~{ESTIMATED_WAIT_MINUTES * (index + 1)} min
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-4 border-t border-iron-border/30 flex items-center justify-between">
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
