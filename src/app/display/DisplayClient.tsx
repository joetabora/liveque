"use client";

import { useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueue } from "@/hooks/useQueue";
import { Clock } from "@/components/ui/Clock";

export default function DisplayClient() {
  const { waiting, serving, loading, servingChanged, playNotification } =
    useQueue();
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
            Loading
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
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Milwaukee <span className="text-harley-orange">Harley-Davidson</span>
          </h1>
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
      <main className="relative z-10 flex-1 flex flex-col px-8 py-10">
        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white">
            Appointments <span className="text-harley-orange">Today!</span>
          </h2>
        </div>

        {/* Now Serving Banner */}
        <AnimatePresence mode="wait">
          {serving && (
            <motion.div
              key={serving.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="glow-orange-strong rounded-2xl bg-iron-panel/80 border border-harley-orange/30 px-10 py-6 mb-8 flex items-center justify-between"
            >
              <div className="flex items-center gap-5">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-harley-orange opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-harley-orange" />
                </span>
                <span className="text-lg font-bold uppercase tracking-widest text-harley-orange">
                  Now Serving
                </span>
              </div>
              <h3 className="text-4xl md:text-5xl lg:text-6xl font-black text-white text-glow-orange">
                {serving.name}
              </h3>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Appointment List */}
        <div className="flex-1">
          {waiting.length === 0 && !serving ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-600">
              <h3 className="text-4xl font-bold tracking-tight">No Appointments</h3>
              <p className="mt-3 text-lg">The queue is currently empty</p>
            </div>
          ) : (
            <div className="grid gap-3">
              <AnimatePresence>
                {waiting.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    className={`
                      flex items-center px-8 py-5 rounded-2xl border transition-all duration-300
                      ${
                        index === 0
                          ? "bg-iron-panel border-harley-orange/20 shadow-lg"
                          : "bg-iron-dark/60 border-iron-border/40"
                      }
                    `}
                  >
                    <span
                      className={`
                        text-2xl font-black w-12 text-center
                        ${index === 0 ? "text-harley-orange" : "text-gray-600"}
                      `}
                    >
                      {index + 1}
                    </span>
                    <h3
                      className={`text-2xl md:text-3xl font-bold tracking-tight ${
                        index === 0 ? "text-white" : "text-gray-300"
                      }`}
                    >
                      {item.name}
                    </h3>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
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
