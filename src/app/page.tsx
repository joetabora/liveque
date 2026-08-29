"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { IronQueueLogo } from "@/components/IronQueueLogo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-iron-black relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-primary/5 rounded-full blur-[120px]" />
      </div>

      <nav className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <IronQueueLogo size="sm" />
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link href="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
            Real-time queues for{" "}
            <span className="text-brand-primary">every business</span>
          </h1>
          <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto">
            LiveQue powers appointment display boards for dealerships, salons, clinics, and repair shops. Set up in under 10 minutes.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Link href="/mkehd/display/main?kiosk=1">
              <Button variant="secondary" size="lg">Landscape Demo</Button>
            </Link>
            <Link href="/mkehd/display/portrait?kiosk=1">
              <Button variant="secondary" size="lg">Portrait Demo</Button>
            </Link>
            <Link href="/mkehd/display/media-portrait?kiosk=1">
              <Button variant="secondary" size="lg">Media Portrait Demo</Button>
            </Link>
          </div>
        </motion.div>

        <div className="mt-24 grid md:grid-cols-3 gap-6">
          {[
            { title: "TV Display", desc: "Full-screen kiosk mode with real-time updates and sound notifications." },
            { title: "Staff Dashboard", desc: "Add, serve, skip, and reorder customers from any device." },
            { title: "White Label", desc: "Your logo, colors, and messaging on every screen." },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="bg-iron-panel/50 border border-iron-border rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold">{feature.title}</h3>
              <p className="mt-2 text-gray-500 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <p className="text-gray-500 text-sm">Starting at $49/mo · 14-day free trial</p>
        </div>
      </main>
    </div>
  );
}
