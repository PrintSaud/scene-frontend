// /Users/saudceo/flick-frontend/shared/config.js
// Vite/Web friendly: uses import.meta.env

// Note: this file is only used by the web build. RN uses config.native.js.
const env = (k) => (import.meta?.env?.[`VITE_${k}`] ?? "");

export const backend = env("BACKEND_URL");
export const TMDB_KEY = env("TMDB_API_KEY");
export const GIPHY_KEY = env("GIPHY_API_KEY");
export const GOOGLE_CLIENT_ID = env("GOOGLE_CLIENT_ID");
export const CLOUDINARY_CLOUD_NAME = env("CLOUDINARY_CLOUD_NAME");
export const CLOUDINARY_API_KEY = env("CLOUDINARY_API_KEY");
export const OPENAI_API_KEY = env("OPENAI_API_KEY");

export const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
export const TMDB_POSTER = "https://image.tmdb.org/t/p/w300";
export const TMDB_BASE_URL = "https://api.themoviedb.org/3";

if (!backend) {
  // eslint-disable-next-line no-console
  console.warn("[shared/config] VITE_BACKEND_URL is empty.");
}
