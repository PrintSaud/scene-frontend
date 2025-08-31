const TMDB_BASE = "https://image.tmdb.org/t/p/";
const FALLBACK_POSTER = "/default-poster.jpg";

const OVERRIDDEN_POSTERS = {
  21484: "https://image.tmdb.org/t/p/original/iAdsTUNjpHIREH4C4UNhkbVDWYi.jpg",
};

function getPosterUrl(input) {
  if (typeof input === "number" || typeof input === "string") {
    return FALLBACK_POSTER; // keep primitive case simple
  }

  const { tmdbId, posterPath, override, ownerMap, size = "w342" } = input || {};
  const idNum = Number(tmdbId);

  // custom overrides
  if (OVERRIDDEN_POSTERS[idNum]) return OVERRIDDEN_POSTERS[idNum];
  if (ownerMap?.[idNum]) return ownerMap[idNum];
  if (override) return override;

  // if we have poster path, build TMDB URL
  if (posterPath) {
    if (posterPath.startsWith("http")) return posterPath;
    return `${TMDB_BASE}${size}${posterPath}`;
  }

  // ⚡ fallback: use TMDB id directly if no poster_path saved
  if (idNum) {
    return `https://image.tmdb.org/t/p/w342/${idNum}.jpg`;
  }

  return FALLBACK_POSTER;
}

export default getPosterUrl;
