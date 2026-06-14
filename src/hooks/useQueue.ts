"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { COLLECTION_NAME, USE_LEGACY_QUEUE } from "@/lib/constants";
import type { QueueItem } from "@/lib/types";

interface UseQueueOptions {
  tenantId?: string | null;
  useLegacy?: boolean;
}

function getQueueCollectionPath(tenantId: string | null | undefined, useLegacy: boolean) {
  if (useLegacy || !tenantId) {
    return COLLECTION_NAME;
  }
  return `tenants/${tenantId}/queue`;
}

export function useQueue(options: UseQueueOptions = {}) {
  const { tenantId = null, useLegacy = USE_LEGACY_QUEUE } = options;
  const [waiting, setWaiting] = useState<QueueItem[]>([]);
  const [serving, setServing] = useState<QueueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);
  const prevServingId = useRef<string | null>(null);
  const [servingChanged, setServingChanged] = useState(false);

  const collectionPath = getQueueCollectionPath(tenantId, useLegacy);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const db = getDb();
    const queueRef = collection(db, collectionPath);

    const waitingQuery = query(
      queueRef,
      where("status", "==", "waiting"),
      orderBy("position", "asc")
    );

    const servingQuery = query(queueRef, where("status", "==", "serving"));

    let loadCount = 0;
    const markLoaded = () => {
      loadCount++;
      if (loadCount >= 2) setLoading(false);
    };

    const unsubWaiting = onSnapshot(
      waitingQuery,
      (snapshot) => {
        setConnected(true);
        const items: QueueItem[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as QueueItem[];
        setWaiting(items);
        markLoaded();
      },
      (err) => {
        console.error("Waiting query error:", err);
        setError("Connection lost. Retrying...");
        setConnected(false);
        markLoaded();
      }
    );

    const unsubServing = onSnapshot(
      servingQuery,
      (snapshot) => {
        setConnected(true);
        if (snapshot.empty) {
          setServing(null);
          prevServingId.current = null;
        } else {
          const item = {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data(),
          } as QueueItem;

          if (
            prevServingId.current !== null &&
            prevServingId.current !== item.id
          ) {
            setServingChanged(true);
            setTimeout(() => setServingChanged(false), 3000);
          }
          prevServingId.current = item.id;
          setServing(item);
        }
        markLoaded();
      },
      (err) => {
        console.error("Serving query error:", err);
        setError("Connection lost. Retrying...");
        setConnected(false);
        markLoaded();
      }
    );

    return () => {
      unsubWaiting();
      unsubServing();
    };
  }, [collectionPath, tenantId, useLegacy]);

  const playNotification = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio not available
    }
  }, []);

  return {
    waiting,
    serving,
    loading,
    error,
    connected,
    servingChanged,
    playNotification,
  };
}
