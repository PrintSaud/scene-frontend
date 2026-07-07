const RAW = process.env.EXPO_PUBLIC_BACKEND_URL;

export const backend =
  RAW?.trim()?.replace(/\/$/, "") || "https://backend.scenesa.com";

export const TMDB_IMG = "https://image.tmdb.org/t/p/w500";