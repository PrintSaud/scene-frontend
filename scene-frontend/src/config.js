// src/config.js

const RAW =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.EXPO_PUBLIC_BACKEND_URL;

export const backend =
  RAW?.trim()?.replace(/\/$/, "") ||
  "https://scene-backend-tv-production.up.railway.app";

export const TMDB_IMG =
  "https://image.tmdb.org/t/p/w500";
