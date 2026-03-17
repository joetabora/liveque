"use client";

import dynamic from "next/dynamic";

const AdminClient = dynamic(() => import("./AdminClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#0065a6] border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-500 uppercase tracking-widest text-sm">
          Loading Dashboard
        </span>
      </div>
    </div>
  ),
});

export default function AdminPage() {
  return <AdminClient />;
}
