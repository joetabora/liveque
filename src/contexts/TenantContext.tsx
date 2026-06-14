"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface TenantBranding {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  brandColor: string | null;
  accentColor: string | null;
  welcomeMessage: string | null;
  displayHeadline: string | null;
  settings: {
    terminology?: { guestLabel?: string; queueLabel?: string };
    serviceTypes?: string[];
    timezone?: string;
  } | null;
}

interface TenantContextValue {
  tenant: TenantBranding | null;
  loading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  loading: true,
  error: null,
});

export function TenantProvider({
  slug,
  children,
  fallback,
}: {
  slug: string;
  children: ReactNode;
  fallback?: TenantBranding;
}) {
  const [tenant, setTenant] = useState<TenantBranding | null>(fallback ?? null);
  const [loading, setLoading] = useState(!fallback);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fallback) {
      setTenant(fallback);
      setLoading(false);
      return;
    }

    fetch(`/api/tenants/${slug}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Tenant not found");
        return res.json();
      })
      .then((data) => {
        setTenant(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug, fallback]);

  return (
    <TenantContext.Provider value={{ tenant, loading, error }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
