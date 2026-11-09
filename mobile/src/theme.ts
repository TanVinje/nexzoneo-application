export const colors = {
  deepNavy: "#141B4D",
  softRoyalBlue: "#53619A",
  mutedBlue: "#7890B0",
  warmBeige: "#E9DFCC",
  white: "#FFFFFF",
  text: "#1a1a2e",
  textMuted: "#6b7280",
  success: "#10b981",
  danger: "#ef4444",
};

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Decision 1C (hybrid later):
 * Shared multi-tenant app now. Optional tenant id pins branding/catalog for a
 * future per-company EAS build without rewriting runtime resolution.
 * Leave empty for the shared Nexzoneo marketplace experience.
 */
export const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID || "";
