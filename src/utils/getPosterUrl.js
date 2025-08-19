// utils/getPosterUrl.js
const TMDB_BASE = "https://image.tmdb.org/t/p/";
const FALLBACK_POSTER = "/default-poster.jpg";

// Global single-movie overrides if you have any
const OVERRIDDEN_POSTERS = {
  21484: "https://image.tmdb.org/t/p/original/iAdsTUNjpHIREH4C4UNhkbVDWYi.jpg", // Possession (1981)
};

/**
 * Flexible poster resolver.
 * - Call like before: getPosterUrl(tmdbId, posterPath, posterOverride)
 * - Or with an object: getPosterUrl({ tmdbId, posterPath, override, ownerMap, size: "w342" })
 *
 * Precedence: owner override → explicit override → TMDB path → fallback
 */
export default function getPosterUrl(a, b, c) {
  // Support old signature
  if (typeof a === "number" || typeof a === "string") {
    const tmdbId = Number(a);
    const posterPath = b;
    const override = c;
    if (OVERRIDDEN_POSTERS[tmdbId]) return OVERRIDDEN_POSTERS[tmdbId];
    if (override) return override;
    if (posterPath) return `${TMDB_BASE}w342${posterPath}`; // smaller & faster than w500
    return FALLBACK_POSTER;
  }

  // New signature: object
  const {
    tmdbId,
    posterPath,
    override,
    ownerMap,   // { [tmdbId]: url } for the PROFILE OWNER (not current user)
    size = "w342",
  } = a || {};

  const idNum = Number(tmdbId);
  if (OVERRIDDEN_POSTERS[idNum]) return OVERRIDDEN_POSTERS[idNum];

  const ownerOverride = ownerMap && idNum && ownerMap[idNum];
  if (ownerOverride) return ownerOverride;

  if (override) return override;
  if (posterPath) return `${TMDB_BASE}${size}${posterPath}`;
  return FALLBACK_POSTER;
}
