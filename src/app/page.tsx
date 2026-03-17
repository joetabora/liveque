"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { IronQueueLogo } from "@/components/IronQueueLogo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-iron-black flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-harley-orange/5 rounded-full blur-[150px]" />
      </div>

      <header className="relative z-10 px-8 py-6">
        <IronQueueLogo size="md" />
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.9]">
            <span className="text-white">SERVICE</span>
            <br />
            <span className="text-harley-orange text-glow-orange">QUEUE</span>
            <br />
            <span className="text-white">SYSTEM</span>
          </h1>

          <p className="mt-8 text-lg sm:text-xl text-gray-400 max-w-xl mx-auto leading-relaxed">
            Real-time queue management built for high-performance service shops.
            Display. Manage. Serve.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/display"
              className="inline-flex items-center gap-3 bg-harley-orange hover:bg-harley-orange-dark text-white font-bold text-lg uppercase tracking-wider px-10 py-5 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-harley-orange/30 active:scale-95"
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
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Display Screen
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center gap-3 bg-iron-panel border border-iron-border hover:border-harley-orange/50 text-white hover:text-harley-orange font-bold text-lg uppercase tracking-wider px-10 py-5 rounded-2xl transition-all duration-200 active:scale-95"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Admin Dashboard
            </Link>
          </div>
        </motion.div>

        {/* Feature badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-20 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 uppercase tracking-widest"
        >
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-harley-orange" />
            Real-Time
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-harley-orange" />
            TV Display
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-harley-orange" />
            Drag & Drop
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-harley-orange" />
            Instant Updates
          </span>
        </motion.div>
      </main>

      <footer className="relative z-10 px-8 py-6 text-center">
        <p className="text-xs text-gray-700 uppercase tracking-widest">
          Built for performance. Built for service.
        </p>
      </footer>
    </div>
  );
}
