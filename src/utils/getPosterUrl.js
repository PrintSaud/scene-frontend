// utils/getPosterUrl.js

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const FALLBACK_POSTER = "/default-poster.jpg";

// Special override for Possession (1981)
const OVERRIDDEN_POSTERS = {
  21484: "https://image.tmdb.org/t/p/original/iAdsTUNjpHIREH4C4UNhkbVDWYi.jpg", // Possession
};

export default function getPosterUrl(tmdbId, posterPath, posterOverride) {
  if (OVERRIDDEN_POSTERS[tmdbId]) return OVERRIDDEN_POSTERS[tmdbId];
  if (posterOverride) return posterOverride;
  if (posterPath) return `${TMDB_IMG}${posterPath}`;
  return FALLBACK_POSTER;
}
