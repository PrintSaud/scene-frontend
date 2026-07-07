// /Users/saudceo/flick-frontend/shared/config.native.js
// Expo/Metro friendly: uses process.env only (no import.meta)

const getEnv = (name) => {
    // Prefer Expo public vars, then fall back to Vite vars if present
    if (typeof process !== "undefined" && process.env) {
      return (
        process.env[`EXPO_PUBLIC_${name}`] ??
        process.env[`VITE_${name}`] ??
        ""
      );
    }
    return "";
  };
  
  export const backend = getEnv("BACKEND_URL");
  export const TMDB_KEY = getEnv("TMDB_API_KEY");
  export const GIPHY_KEY = getEnv("GIPHY_API_KEY");
  export const GOOGLE_CLIENT_ID = getEnv("GOOGLE_CLIENT_ID");
  export const CLOUDINARY_CLOUD_NAME = getEnv("CLOUDINARY_CLOUD_NAME");
  export const CLOUDINARY_API_KEY = getEnv("CLOUDINARY_API_KEY");
  export const OPENAI_API_KEY = getEnv("OPENAI_API_KEY");
  
  export const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
  export const TMDB_POSTER = "https://image.tmdb.org/t/p/w300";
  export const TMDB_BASE_URL = "https://api.themoviedb.org/3";
  
  if (!backend) {
    console.warn(
      "[shared/config.native] backend URL is empty. Set EXPO_PUBLIC_BACKEND_URL (Expo) or VITE_BACKEND_URL."
    );
  }
  