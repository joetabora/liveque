export const COLLECTION_NAME = "queue";

export const LEGACY_TENANT_SLUG =
  process.env.LEGACY_TENANT_SLUG ?? process.env.NEXT_PUBLIC_LEGACY_TENANT_SLUG ?? "mkehd";

export const USE_LEGACY_QUEUE =
  process.env.USE_LEGACY_QUEUE === "true" ||
  process.env.NEXT_PUBLIC_USE_LEGACY_QUEUE === "true";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.AUTH_URL ??
  "http://localhost:3000";

export const THEME = {
  bg: "#0a0a0a",
  bgSecondary: "#141414",
  bgPanel: "#1a1a1a",
  accent: "#ff6600",
  accentGlow: "rgba(255, 102, 0, 0.3)",
  accentMuted: "#cc5200",
  text: "#ffffff",
  textSecondary: "#a0a0a0",
  textMuted: "#666666",
  border: "#2a2a2a",
  success: "#22c55e",
  danger: "#ef4444",
} as const;

export const ESTIMATED_WAIT_MINUTES = 15;

export const PLAN_LIMITS = {
  starter: { locations: 1, displays: 1, staff: 3 },
  professional: { locations: 1, displays: null, staff: null },
  enterprise: { locations: null, displays: null, staff: null },
} as const;
