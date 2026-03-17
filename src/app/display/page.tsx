"use client";

import dynamic from "next/dynamic";

const DisplayClient = dynamic(() => import("./DisplayClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#ff6600] border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-500 uppercase tracking-widest text-sm">
          Loading Queue
        </span>
      </div>
    </div>
  ),
});

export default function DisplayPage() {
  return <DisplayClient />;
}
