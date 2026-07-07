const TMDB_BASE = "https://image.tmdb.org/t/p/";
const FALLBACK_POSTER = "/default-poster.jpg";

const OVERRIDDEN_POSTERS = {
  21484: "https://image.tmdb.org/t/p/original/iAdsTUNjpHIREH4C4UNhkbVDWYi.jpg",
};

function getPosterUrl(arg, posters = {}, movie) {
  // Case 1: arg is number/string (tmdbId)
  if (typeof arg === "number" || typeof arg === "string") {
    const idNum = Number(arg);
    if (!idNum) return FALLBACK_POSTER;

    // custom overrides
    if (OVERRIDDEN_POSTERS[idNum]) return OVERRIDDEN_POSTERS[idNum];
    if (posters?.[idNum]) return posters[idNum];

    // movie.poster_path fallback if provided
    if (movie?.poster_path) {
      return `${TMDB_BASE}w342${movie.poster_path}`;
    }

    return FALLBACK_POSTER;
  }

  // Case 2: arg is object
  const { tmdbId, posterPath, override, ownerMap, size = "w342" } = arg || {};
  const idNum = Number(tmdbId);

  if (OVERRIDDEN_POSTERS[idNum]) return OVERRIDDEN_POSTERS[idNum];
  if (ownerMap?.[idNum]) return ownerMap[idNum];
  if (override) return override;

  if (posterPath) {
    if (posterPath.startsWith("http")) return posterPath;
    return `${TMDB_BASE}${size}${posterPath}`;
  }

  return FALLBACK_POSTER;
}

export default getPosterUrl;
