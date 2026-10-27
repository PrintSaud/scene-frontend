// src/config.js

const RAW = process.env.EXPO_PUBLIC_BACKEND_URL;

// ✅ Normalize + fallback so production never becomes undefined
export const backend =
  RAW?.trim()?.replace(/\/$/, "") || "https://backend.scenesa.com";

export const TMDB_IMG = "https://image.tmdb.org/t/p/w500";