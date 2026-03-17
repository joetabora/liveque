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
import { COLLECTION_NAME } from "@/lib/constants";
import type { QueueItem } from "@/lib/types";

export function useQueue() {
  const [waiting, setWaiting] = useState<QueueItem[]>([]);
  const [serving, setServing] = useState<QueueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const prevServingId = useRef<string | null>(null);
  const [servingChanged, setServingChanged] = useState(false);

  useEffect(() => {
    const db = getDb();
    const queueRef = collection(db, COLLECTION_NAME);

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
        const items: QueueItem[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as QueueItem[];
        setWaiting(items);
        markLoaded();
      },
      (error) => {
        console.error("Waiting query error:", error);
        markLoaded();
      }
    );

    const unsubServing = onSnapshot(
      servingQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setServing(null);
          prevServingId.current = null;
        } else {
          const item = {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data(),
          } as QueueItem;

          if (prevServingId.current !== null && prevServingId.current !== item.id) {
            setServingChanged(true);
            setTimeout(() => setServingChanged(false), 3000);
          }
          prevServingId.current = item.id;
          setServing(item);
        }
        markLoaded();
      },
      (error) => {
        console.error("Serving query error:", error);
        markLoaded();
      }
    );

    return () => {
      unsubWaiting();
      unsubServing();
    };
  }, []);

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

  return { waiting, serving, loading, servingChanged, playNotification };
}
