"use client";

import { useEffect, useState } from "react";
import { useQueue } from "@/hooks/useQueue";
import { USE_LEGACY_QUEUE } from "@/lib/constants";

export default function QueueCheckClient({
  tenantId,
  useLegacy = USE_LEGACY_QUEUE,
}: {
  tenantId: string;
  useLegacy?: boolean;
}) {
  const { waiting, serving, loading, connected, error } = useQueue({
    tenantId,
    useLegacy,
  });
  const [host, setHost] = useState("");

  useEffect(() => {
    setHost(window.location.host);
  }, []);

  if (loading) {
    return <p className="mt-6 text-gray-400">Loading live queue from Firebase…</p>;
  }

  return (
    <section className="mt-10 border-t border-iron-border pt-8">
      <h2 className="text-2xl font-bold">Live appointment queue</h2>
      <p className="mt-2 text-sm text-gray-500">
        Host: <span className="text-gray-300">{host || "…"}</span>
        {" · "}
        Firebase:{" "}
        <span className={connected ? "text-green-400" : "text-red-400"}>
          {connected ? "connected" : "disconnected"}
        </span>
      </p>
      {error && <p className="mt-2 text-amber-400">{error}</p>}

      <p className="mt-4 text-xl font-semibold text-brand-primary">
        {waiting.length} waiting
        {serving ? ` · now serving: ${serving.name}` : ""}
      </p>

      {waiting.length === 0 && !serving ? (
        <p className="mt-4 text-gray-500">Queue is empty.</p>
      ) : (
        <ol className="mt-4 space-y-2 list-decimal list-inside text-lg">
          {serving && (
            <li className="font-bold text-white">
              (Serving) {serving.name}
              {serving.hereToSee ? ` — ${serving.hereToSee}` : ""}
            </li>
          )}
          {waiting.map((item) => (
            <li key={item.id} className="text-white">
              {item.name || "(no name)"}
              {item.hereToSee ? ` — ${item.hereToSee}` : ""}
            </li>
          ))}
        </ol>
      )}

      <p className="mt-6 text-sm text-gray-500 max-w-xl">
        If names show here but not on Queue admin, the admin layout was clipping
        text on this browser. If names are missing here too, Firebase is not
        connecting on this device.
      </p>
    </section>
  );
}
