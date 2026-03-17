"use client";

import { useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { getAuthInstance } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authInstance = getAuthInstance();
    const unsub = onAuthStateChanged(authInstance, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async (email: string, password: string) => {
    const authInstance = getAuthInstance();
    return signInWithEmailAndPassword(authInstance, email, password);
  };

  const signOut = async () => {
    const authInstance = getAuthInstance();
    return firebaseSignOut(authInstance);
  };

  return { user, loading, signIn, signOut };
}
